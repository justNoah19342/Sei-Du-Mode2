// Worker entry point for the "sei-du-mode2" Cloudflare Workers (static assets)
// deployment. Handles /api/facebook-videos itself; everything else falls
// through to the built site in ./dist via the ASSETS binding.
const GRAPH_API_VERSION = "v21.0";

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

  // Regular videos and Reels are separate content types on the Graph API —
  // /videos alone misses Reels, so both edges are fetched and merged.
  const videosUrl = new URL(`https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}/videos`);
  videosUrl.searchParams.set("fields", "id,title,description,permalink_url,picture");
  videosUrl.searchParams.set("limit", "8");
  videosUrl.searchParams.set("access_token", accessToken);

  const reelsUrl = new URL(`https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}/video_reels`);
  reelsUrl.searchParams.set("fields", "id,description,permalink_url,picture");
  reelsUrl.searchParams.set("limit", "8");
  reelsUrl.searchParams.set("access_token", accessToken);

  let videosResponse, reelsResponse;
  try {
    [videosResponse, reelsResponse] = await Promise.all([fetch(videosUrl), fetch(reelsUrl)]);
  } catch {
    return jsonResponse({ error: "Facebook API unreachable" }, 502);
  }

  if (!videosResponse.ok && !reelsResponse.ok) {
    return jsonResponse({ error: "Facebook API request failed" }, 502);
  }

  const videosData = videosResponse.ok ? await videosResponse.json() : { data: [] };
  const reelsData = reelsResponse.ok ? await reelsResponse.json() : { data: [] };

  // Reels show up under both edges, so dedupe by id before mapping.
  const byId = new Map();
  for (const item of [...(videosData.data || []), ...(reelsData.data || [])]) {
    byId.set(item.id, item);
  }

  const videos = [...byId.values()].map((video) => ({
    id: video.id,
    title: video.title || video.description?.slice(0, 80) || "Video",
    thumbnail: video.picture || null,
    permalinkUrl: toAbsoluteUrl(video.permalink_url),
  }));

  return jsonResponse({ videos }, 200, {
    // Short edge/browser cache so the widget doesn't call the Graph API on
    // every single page load.
    "cache-control": "public, max-age=600",
  });
}

function toAbsoluteUrl(permalinkUrl) {
  if (!permalinkUrl) return null;
  return permalinkUrl.startsWith("http") ? permalinkUrl : `https://www.facebook.com${permalinkUrl}`;
}

function jsonResponse(body, status, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...extraHeaders },
  });
}
