// Worker entry point for the "sei-du-mode2" Cloudflare Workers (static assets)
// deployment. Handles /api/facebook-videos itself; everything else falls
// through to the built site in ./dist via the ASSETS binding. Google Reviews
// are static hand-written copy now (see src/data/reviews.js) — no longer
// fetched through here.
const GRAPH_API_VERSION = "v26.0";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/facebook-videos") {
      return handleFacebookVideos(request, env);
    }

    if (url.pathname === "/admin/video-status") {
      return handleVideoStatusPage(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

async function handleFacebookVideos(request, env) {
  const pageId = env.FB_PAGE_ID;
  const accessToken = env.FB_PAGE_ACCESS_TOKEN;

  if (!pageId || !accessToken) {
    return jsonResponse({ error: "Facebook API not configured" }, 503);
  }

  // The page only actually publishes Reels. The /videos edge also lists
  // these same Reels, but as stale duplicate records with a second, no
  // longer resolvable permalink (facebook.com/{page-id}/videos/{id}) and an
  // empty description, instead of the working facebook.com/reel/{id} link
  // /video_reels gives — so /videos is skipped entirely rather than merged.
  // If the page ever posts a real classic video again, that edge would need
  // re-adding here.
  const reelsUrl = new URL(`https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}/video_reels`);
  reelsUrl.searchParams.set(
    "fields",
    "id,permalink_url,picture,created_time,description,width,height,likes.summary(true).limit(0)"
  );
  reelsUrl.searchParams.set("limit", "30");
  reelsUrl.searchParams.set("access_token", accessToken);

  // A few retries plus a last-known-good fallback below, in case Facebook's
  // API has a brief hiccup — so a transient failure never blanks out the
  // section on the live site. (The token needs pages_read_user_content, not
  // just pages_show_list/pages_read_engagement/business_management, or this
  // edge fails outright with an OAuth error regardless of retries.)
  const cache = caches.default;
  const lastGoodKey = new Request("https://sei-du-mode2.internal-cache/fb-reels-last-good");

  let reelsData = null;
  for (let attempt = 0; attempt < 3 && !reelsData; attempt++) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    try {
      const response = await fetch(reelsUrl);
      if (!response.ok) continue;
      const body = await response.json();
      // The Graph API can respond 200 with an { error: {...} } body instead
      // of an HTTP error status (expired/invalid token, revoked permission,
      // rate limiting) — treat that the same as a failed attempt so it gets
      // retried instead of being accepted as "zero videos".
      if (body.error) continue;
      reelsData = body;
    } catch {
      // network hiccup — fall through to the next retry
    }
  }

  if (!reelsData) {
    const cached = await cache.match(lastGoodKey);
    // Logged for /admin/video-status: every time all 3 attempts against the
    // Graph API failed, regardless of whether the fallback cache still had
    // something to show the visitor — the fallback hides this from the
    // visitor, but it's still a real Facebook-side failure worth tracking.
    logVideoFailure(env, request, cached ? "fallback_cache" : "hard_failure");
    if (cached) return cached;
    return jsonResponse({ error: "Facebook API request failed" }, 502);
  }

  const videos = (reelsData.data || [])
    .sort((a, b) => new Date(b.created_time) - new Date(a.created_time))
    .slice(0, 30)
    .map((video) => ({
      id: video.id,
      thumbnail: video.picture || null,
      permalinkUrl: `https://www.facebook.com/reel/${video.id}`,
      description: video.description || "",
      createdTime: video.created_time || null,
      width: video.width || null,
      height: video.height || null,
      likeCount: video.likes?.summary?.total_count ?? 0,
    }));

  const result = jsonResponse({ videos }, 200, {
    // Short edge/browser cache so the widget doesn't call the Graph API on
    // every single page load.
    "cache-control": "public, max-age=600",
  });
  // Separate, longer-lived copy kept purely as the fallback for a future
  // request that hits the flakiness above.
  await cache.put(lastGoodKey, new Response(JSON.stringify({ videos }), {
    headers: { "content-type": "application/json", "cache-control": "public, max-age=21600" },
  }));
  return result;
}

function jsonResponse(body, status, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...extraHeaders },
  });
}

// Fire-and-forget: a failed write here should never break the actual
// /api/facebook-videos response the visitor is waiting on. Silently no-ops
// if the FB_VIDEO_FAILURES binding isn't configured (e.g. locally).
function logVideoFailure(env, request, reason) {
  if (!env.FB_VIDEO_FAILURES) return;
  try {
    env.FB_VIDEO_FAILURES.writeDataPoint({
      blobs: [request.headers.get("cf-connecting-ip") || "unknown"],
      doubles: [1],
      indexes: [reason],
    });
  } catch {
    // Analytics Engine hiccup — not worth failing the request over.
  }
}

// Password-gated (HTTP Basic Auth) internal page graphing how often the
// Facebook-videos fetch has actually failed (see logVideoFailure above),
// broken down by reason, over a selectable time window. Meant for us to
// check in on, not for site visitors.
async function handleVideoStatusPage(request, env) {
  // Each person gets their own name + password pair (rather than one shared
  // login) — set as separate Worker secrets (ADMIN_PASSWORD_<NAME>) so any
  // one person's access can be revoked/rotated without affecting the other.
  const auth = request.headers.get("authorization");
  const [username, password] = auth?.startsWith("Basic ") ? atob(auth.slice(6)).split(":") : [null, null];
  const expectedPassword = username ? env[`ADMIN_PASSWORD_${username.toUpperCase()}`] : null;
  if (!expectedPassword || password !== expectedPassword) {
    return new Response("Authentication required", {
      status: 401,
      headers: { "www-authenticate": 'Basic realm="Video-Status"' },
    });
  }

  const url = new URL(request.url);
  const range = url.searchParams.get("range") === "7d" ? "7d" : "24h";
  const { unit, lookbackAmount } = range === "7d"
    ? { unit: "DAY", lookbackAmount: "7" }
    : { unit: "HOUR", lookbackAmount: "24" };

  let rows = [];
  let queryError = null;
  if (env.CF_ACCOUNT_ID && env.CF_API_TOKEN) {
    try {
      const sql = `
        SELECT
          toStartOfInterval(timestamp, INTERVAL '1' ${unit}) AS bucket,
          index1 AS reason,
          sum(_sample_interval) AS count
        FROM fb_video_failures
        WHERE timestamp > NOW() - INTERVAL '${lookbackAmount}' ${unit}
        GROUP BY bucket, reason
        ORDER BY bucket
        FORMAT JSON
      `;
      const resp = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/analytics_engine/sql`,
        { method: "POST", headers: { authorization: `Bearer ${env.CF_API_TOKEN}`, "content-type": "text/plain" }, body: sql }
      );
      const text = await resp.text();
      if (!resp.ok) {
        queryError = `HTTP ${resp.status}: ${text.slice(0, 300)}`;
      } else {
        const json = JSON.parse(text);
        rows = json.data || [];
      }
    } catch (err) {
      queryError = String(err);
    }
  } else {
    queryError = "CF_ACCOUNT_ID / CF_API_TOKEN nicht konfiguriert";
  }

  return new Response(renderVideoStatusHtml({ rows, range, unit, queryError }), {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

const REASON_LABELS = {
  hard_failure: { label: "Komplett fehlgeschlagen (Besucher sieht nichts)", color: "#dc2626" },
  fallback_cache: { label: "Notfall-Speicher genutzt (Besucher sieht letzte gute Liste)", color: "#f59e0b" },
};

function renderVideoStatusHtml({ rows, range, unit, queryError }) {
  const buckets = [...new Set(rows.map((r) => r.bucket))].sort();
  const reasons = Object.keys(REASON_LABELS);
  const series = reasons.map((reason) => ({
    reason,
    ...REASON_LABELS[reason],
    values: buckets.map((b) => rows.find((r) => r.bucket === b && r.reason === reason)?.count ?? 0),
  }));
  const maxCount = Math.max(1, ...series.flatMap((s) => s.values));
  const totalFailures = rows.reduce((sum, r) => sum + Number(r.count || 0), 0);

  const W = 880;
  const H = 320;
  const padL = 40;
  const padB = 30;
  const padT = 10;
  const plotW = W - padL - 10;
  const plotH = H - padT - padB;
  const xStep = buckets.length > 1 ? plotW / (buckets.length - 1) : 0;

  function pathFor(values) {
    return values
      .map((v, i) => `${i === 0 ? "M" : "L"} ${(padL + i * xStep).toFixed(1)} ${(padT + plotH - (v / maxCount) * plotH).toFixed(1)}`)
      .join(" ");
  }

  function formatBucket(iso) {
    const d = new Date(iso.replace(" ", "T") + "Z");
    return unit === "DAY"
      ? d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })
      : d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  }

  const gridLines = 4;
  const yLabels = Array.from({ length: gridLines + 1 }, (_, i) => Math.round((maxCount / gridLines) * i));

  const svg = buckets.length === 0
    ? `<p class="empty">Keine Fehlschläge im gewählten Zeitraum${queryError ? "" : " — gut so."}</p>`
    : `
    <svg viewBox="0 0 ${W} ${H}" class="chart">
      ${yLabels.map((v, i) => {
        const y = padT + plotH - (v / maxCount) * plotH;
        return `<line x1="${padL}" y1="${y}" x2="${W - 10}" y2="${y}" class="grid" />
                <text x="${padL - 6}" y="${y + 4}" class="axis-label" text-anchor="end">${v}</text>`;
      }).join("")}
      ${buckets.map((b, i) => {
        if (buckets.length > 12 && i % Math.ceil(buckets.length / 12) !== 0) return "";
        const x = padL + i * xStep;
        return `<text x="${x}" y="${H - 8}" class="axis-label" text-anchor="middle">${formatBucket(b)}</text>`;
      }).join("")}
      ${series.map((s) => `<path d="${pathFor(s.values)}" fill="none" stroke="${s.color}" stroke-width="2.5" />`).join("")}
      ${series.map((s) => s.values.map((v, i) =>
        v > 0 ? `<circle cx="${(padL + i * xStep).toFixed(1)}" cy="${(padT + plotH - (v / maxCount) * plotH).toFixed(1)}" r="3.5" fill="${s.color}" />` : ""
      ).join("")).join("")}
    </svg>`;

  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>Facebook-Video-Status</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f8f8f6; color: #111; margin: 0; padding: 32px 16px; }
  .wrap { max-width: 920px; margin: 0 auto; }
  h1 { font-size: 1.3rem; margin: 0 0 4px; }
  .sub { color: #666; font-size: 0.9rem; margin: 0 0 24px; }
  .card { background: #fff; border: 1px solid #e5e5e2; border-radius: 12px; padding: 20px 24px; }
  .tabs { display: flex; gap: 8px; margin-bottom: 16px; }
  .tabs a { padding: 6px 14px; border-radius: 999px; border: 1px solid #ddd; text-decoration: none; color: #333; font-size: 0.85rem; }
  .tabs a.active { background: #111; color: #fff; border-color: #111; }
  .chart { width: 100%; height: auto; }
  .grid { stroke: #eee; stroke-width: 1; }
  .axis-label { font-size: 10px; fill: #888; }
  .legend { display: flex; flex-direction: column; gap: 6px; margin-top: 16px; font-size: 0.85rem; }
  .legend-item { display: flex; align-items: center; gap: 8px; }
  .dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .empty { color: #16a34a; text-align: center; padding: 60px 0; font-size: 0.95rem; }
  .error { color: #dc2626; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 10px 14px; font-size: 0.85rem; margin-bottom: 16px; }
  .total { color: #666; font-size: 0.85rem; margin-top: 4px; }
</style>
</head>
<body>
  <div class="wrap">
    <h1>Facebook-Video-Status</h1>
    <p class="sub">Wie oft die Facebook-Videos-Abfrage nach 3 Versuchen fehlgeschlagen ist.</p>
    <div class="tabs">
      <a href="?range=24h" class="${range === "24h" ? "active" : ""}">Letzte 24 Stunden</a>
      <a href="?range=7d" class="${range === "7d" ? "active" : ""}">Letzte 7 Tage</a>
    </div>
    <div class="card">
      ${queryError ? `<div class="error">Konnte Daten nicht laden: ${escapeHtml(String(queryError))}</div>` : ""}
      ${svg}
      <div class="legend">
        ${series.map((s) => `<div class="legend-item"><span class="dot" style="background:${s.color}"></span>${s.label}</div>`).join("")}
      </div>
      <p class="total">Fehlschläge im Zeitraum insgesamt: ${totalFailures}</p>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
