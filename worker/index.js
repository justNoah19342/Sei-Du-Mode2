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
  let ipRows = [];
  let queryError = null;
  if (env.CF_ACCOUNT_ID && env.CF_API_TOKEN) {
    const timeSeries = await runAnalyticsQuery(env, `
      SELECT
        toStartOfInterval(timestamp, INTERVAL '1' ${unit}) AS bucket,
        index1 AS reason,
        sum(_sample_interval) AS count
      FROM fb_video_failures
      WHERE timestamp > NOW() - INTERVAL '${lookbackAmount}' ${unit}
      GROUP BY bucket, reason
      ORDER BY bucket
      FORMAT JSON
    `);
    const byIp = await runAnalyticsQuery(env, `
      SELECT blob1 AS ip, sum(_sample_interval) AS count
      FROM fb_video_failures
      WHERE timestamp > NOW() - INTERVAL '${lookbackAmount}' ${unit}
      GROUP BY ip
      ORDER BY count DESC
      LIMIT 50
      FORMAT JSON
    `);
    rows = timeSeries.rows;
    ipRows = byIp.rows;
    queryError = timeSeries.error || byIp.error;
  } else {
    queryError = "CF_ACCOUNT_ID / CF_API_TOKEN nicht konfiguriert";
  }

  return new Response(renderVideoStatusHtml({ rows, ipRows, range, unit, queryError }), {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

async function runAnalyticsQuery(env, sql) {
  try {
    const resp = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/analytics_engine/sql`,
      { method: "POST", headers: { authorization: `Bearer ${env.CF_API_TOKEN}`, "content-type": "text/plain" }, body: sql }
    );
    const text = await resp.text();
    if (!resp.ok) return { rows: [], error: `HTTP ${resp.status}: ${text.slice(0, 300)}` };
    return { rows: JSON.parse(text).data || [], error: null };
  } catch (err) {
    return { rows: [], error: String(err) };
  }
}

const REASON_LABELS = {
  hard_failure: { label: "Komplett fehlgeschlagen (Besucher sieht nichts)", color: "#dc2626" },
  fallback_cache: { label: "Notfall-Speicher genutzt (Besucher sieht letzte gute Liste)", color: "#f59e0b" },
};

// Catmull-Rom-to-Bezier smoothing so the lines read as soft curves instead
// of sharp per-bucket segments.
function smoothPath(pts) {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

function renderVideoStatusHtml({ rows, ipRows, range, unit, queryError }) {
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
  const baselineY = padT + plotH;

  function pointsFor(values) {
    return values.map((v, i) => ({ x: padL + i * xStep, y: padT + plotH - (v / maxCount) * plotH }));
  }

  function formatBucket(iso) {
    const d = new Date(iso.replace(" ", "T") + "Z");
    return unit === "DAY"
      ? d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })
      : d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  }

  const gridLines = 4;
  const yLabels = Array.from({ length: gridLines + 1 }, (_, i) => Math.round((maxCount / gridLines) * i));

  // hard_failure (the worse outcome — visitor sees nothing) gets the filled
  // gradient area as the "primary" line; fallback_cache (visitor still sees
  // the last-known-good list) is the dashed secondary line. Mirrors a
  // solid+area-vs-dashed pairing rather than two flat equal-weight lines.
  const areaSeries = series.find((s) => s.reason === "hard_failure");
  const dashedSeries = series.find((s) => s.reason === "fallback_cache");

  const chartData = {
    buckets,
    unit,
    series: series.map((s) => ({ reason: s.reason, label: s.label, color: s.color, values: s.values })),
    padL,
    xStep,
    padT,
    plotH,
    maxCount,
  };

  const svg = buckets.length === 0
    ? `<p class="empty">Keine Fehlschläge im gewählten Zeitraum${queryError ? "" : " — gut so."}</p>`
    : `
    <svg viewBox="0 0 ${W} ${H}" class="chart" id="chart-svg" preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${areaSeries.color}" stop-opacity="0.28" />
          <stop offset="100%" stop-color="${areaSeries.color}" stop-opacity="0.02" />
        </linearGradient>
      </defs>
      ${yLabels.map((v, i) => {
        const y = padT + plotH - (v / maxCount) * plotH;
        return `<line x1="${padL}" y1="${y}" x2="${W - 10}" y2="${y}" class="grid" stroke-dasharray="4 4" />
                <text x="${padL - 6}" y="${y + 4}" class="axis-label" text-anchor="end">${v}</text>`;
      }).join("")}
      ${buckets.map((b, i) => {
        if (buckets.length > 12 && i % Math.ceil(buckets.length / 12) !== 0) return "";
        const x = padL + i * xStep;
        return `<text x="${x}" y="${H - 8}" class="axis-label" text-anchor="middle">${formatBucket(b)}</text>`;
      }).join("")}

      ${(() => {
        const pts = pointsFor(areaSeries.values);
        const line = smoothPath(pts);
        const area = `${line} L ${pts[pts.length - 1].x.toFixed(1)} ${baselineY} L ${pts[0].x.toFixed(1)} ${baselineY} Z`;
        return `<path d="${area}" fill="url(#areaGradient)" stroke="none" />
                <path d="${line}" fill="none" stroke="${areaSeries.color}" stroke-width="2.5" stroke-linecap="round" />`;
      })()}

      ${(() => {
        const pts = pointsFor(dashedSeries.values);
        return `<path d="${smoothPath(pts)}" fill="none" stroke="${dashedSeries.color}" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="6 5" />`;
      })()}

      ${series.map((s) => pointsFor(s.values).map((p) =>
        `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4.5" fill="#fff" stroke="${s.color}" stroke-width="2" />`
      ).join("")).join("")}

      <line id="hover-guide" x1="0" y1="${padT}" x2="0" y2="${baselineY}" class="hover-guide" style="display:none" />
      ${series.map((s) => `<circle class="hover-dot" data-reason="${s.reason}" r="5.5" fill="#fff" stroke="${s.color}" stroke-width="2.5" style="display:none" />`).join("")}
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
  .chart-head { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 18px; }
  .chart-head-title { font-size: 0.95rem; font-weight: 600; margin: 0; }
  .chart-legend { display: flex; gap: 16px; flex-wrap: wrap; font-size: 0.8rem; color: #555; margin: 0; padding: 0; list-style: none; }
  .chart-legend-item { display: flex; align-items: center; gap: 6px; }
  .chart-legend .ring { width: 10px; height: 10px; border-radius: 50%; background: #fff; border: 2px solid; flex-shrink: 0; }
  .chart-wrap { position: relative; }
  .chart { width: 100%; height: auto; display: block; overflow: visible; }
  .grid { stroke: #ececec; stroke-width: 1; }
  .axis-label { font-size: 10px; fill: #999; }
  .hover-guide { stroke: #ccc; stroke-width: 1; }
  .tooltip { position: absolute; pointer-events: none; background: #fff; border: 1px solid #e5e5e2; border-radius: 8px; padding: 8px 12px; font-size: 0.78rem; box-shadow: 0 8px 24px rgba(0,0,0,0.08); min-width: 150px; opacity: 0; transition: opacity 120ms ease; z-index: 5; }
  .tooltip.visible { opacity: 1; }
  .tooltip-date { font-weight: 600; color: #333; margin-bottom: 6px; }
  .tooltip-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .tooltip-row + .tooltip-row { margin-top: 4px; }
  .tooltip-label { display: flex; align-items: center; gap: 6px; color: #666; }
  .tooltip-dot { width: 8px; height: 8px; border-radius: 50%; background: #fff; border: 2px solid; flex-shrink: 0; }
  .tooltip-value { font-weight: 600; color: #111; font-variant-numeric: tabular-nums; }
  .empty { color: #16a34a; text-align: center; padding: 60px 0; font-size: 0.95rem; }
  .error { color: #dc2626; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 10px 14px; font-size: 0.85rem; margin-bottom: 16px; }
  .total { color: #666; font-size: 0.85rem; margin-top: 16px; }
  .card-title { font-size: 1rem; margin: 0 0 12px; }
  .ip-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
  .ip-table th, .ip-table td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #f0f0ee; }
  .ip-table th { color: #666; font-weight: 600; }
  .ip-table td:last-child, .ip-table th:last-child { text-align: right; }
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
      <div class="chart-head">
        <p class="chart-head-title">Ausfälle über Zeit</p>
        <ul class="chart-legend">
          ${series.map((s) => `<li class="chart-legend-item"><span class="ring" style="border-color:${s.color}"></span>${s.label}</li>`).join("")}
        </ul>
      </div>
      <div class="chart-wrap" id="chart-wrap">
        ${svg}
        ${buckets.length > 0 ? `<div class="tooltip" id="tooltip"></div>` : ""}
      </div>
      <p class="total">Fehlschläge im Zeitraum insgesamt: ${totalFailures}</p>
    </div>
    <div class="card" style="margin-top:20px">
      <h2 class="card-title">Nach IP-Adresse</h2>
      ${ipRows.length === 0
        ? `<p class="empty">Keine Fehlschläge im gewählten Zeitraum${queryError ? "" : " — gut so."}</p>`
        : `<table class="ip-table">
            <thead><tr><th>IP-Adresse</th><th>Anzahl Fehlschläge</th></tr></thead>
            <tbody>
              ${ipRows.map((r) => `<tr><td>${escapeHtml(String(r.ip))}</td><td>${r.count}</td></tr>`).join("")}
            </tbody>
          </table>`}
    </div>
  </div>
  ${buckets.length > 0 ? `<script>
    (function () {
      var data = ${JSON.stringify(chartData)};
      var svg = document.getElementById("chart-svg");
      var wrap = document.getElementById("chart-wrap");
      var tooltip = document.getElementById("tooltip");
      var guide = document.getElementById("hover-guide");
      var hoverDots = Array.prototype.slice.call(svg.querySelectorAll(".hover-dot"));
      var W = ${W}, H = ${H};

      function svgPoint(evt) {
        var rect = svg.getBoundingClientRect();
        return {
          x: ((evt.clientX - rect.left) / rect.width) * W,
          y: ((evt.clientY - rect.top) / rect.height) * H,
        };
      }

      svg.addEventListener("mousemove", function (evt) {
        var p = svgPoint(evt);
        var idx = Math.round((p.x - data.padL) / (data.xStep || 1));
        idx = Math.max(0, Math.min(data.buckets.length - 1, idx));
        var x = data.padL + idx * data.xStep;

        guide.setAttribute("x1", x);
        guide.setAttribute("x2", x);
        guide.style.display = "block";

        data.series.forEach(function (s, si) {
          var y = data.padT + data.plotH - (s.values[idx] / data.maxCount) * data.plotH;
          hoverDots[si].setAttribute("cx", x);
          hoverDots[si].setAttribute("cy", y);
          hoverDots[si].style.display = "block";
        });

        var d = new Date(data.buckets[idx].replace(" ", "T") + "Z");
        var dateLabel = data.unit === "DAY"
          ? d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
          : d.toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

        tooltip.innerHTML = '<div class="tooltip-date">' + dateLabel + "</div>" +
          data.series.map(function (s) {
            return '<div class="tooltip-row"><span class="tooltip-label"><span class="tooltip-dot" style="border-color:' + s.color + '"></span>' + s.label.split(" (")[0] + '</span><span class="tooltip-value">' + s.values[idx] + "</span></div>";
          }).join("");

        var wrapRect = wrap.getBoundingClientRect();
        var relX = (x / W) * wrapRect.width;
        var tooltipWidth = tooltip.offsetWidth || 170;
        var left = relX + 16;
        if (left + tooltipWidth > wrapRect.width) left = relX - tooltipWidth - 16;
        tooltip.style.left = left + "px";
        tooltip.style.top = "8px";
        tooltip.classList.add("visible");
      });

      svg.addEventListener("mouseleave", function () {
        guide.style.display = "none";
        hoverDots.forEach(function (d) { d.style.display = "none"; });
        tooltip.classList.remove("visible");
      });
    })();
  <\/script>` : ""}
</body>
</html>`;
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
