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

  const url = new URL(`https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}/videos`);
  url.searchParams.set("fields", "id,title,description,permalink_url,picture");
  url.searchParams.set("limit", "8");
  url.searchParams.set("access_token", accessToken);

  let fbResponse;
  try {
    fbResponse = await fetch(url);
  } catch {
    return jsonResponse({ error: "Facebook API unreachable" }, 502);
  }

  if (!fbResponse.ok) {
    return jsonResponse({ error: "Facebook API request failed" }, 502);
  }

  const data = await fbResponse.json();
  const videos = (data.data || []).map((video) => ({
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
