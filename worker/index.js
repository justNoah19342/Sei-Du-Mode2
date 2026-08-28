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
      return handleFacebookVideos(env);
    }

    return env.ASSETS.fetch(request);
  },
};

async function handleFacebookVideos(env) {
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
      if (response.ok) reelsData = await response.json();
    } catch {
      // network hiccup — fall through to the next retry
    }
  }

  if (!reelsData) {
    const cached = await cache.match(lastGoodKey);
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
