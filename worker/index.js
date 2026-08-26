// Worker entry point for the "sei-du-mode2" Cloudflare Workers (static assets)
// deployment. Handles /api/facebook-videos and /api/google-reviews itself;
// everything else falls through to the built site in ./dist via the ASSETS
// binding.
const GRAPH_API_VERSION = "v21.0";

// Public identifier for the "Sei Du" Mode listing itself — not a secret
// (found via Google's own Place ID Finder tool), safe to hardcode. Only the
// API key (env.GOOGLE_PLACES_API_KEY) needs to stay a Worker secret.
const GOOGLE_PLACE_ID = "ChIJE5MFMwvDvkcRkF5K4vLeLmM";

// Reviews below this are filtered out server-side, before anything reaches
// the browser — deliberate choice, not a bug: only 4-5 star reviews should
// ever be shown.
const MIN_REVIEW_RATING = 4;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/facebook-videos") {
      return handleFacebookVideos(env);
    }

    if (url.pathname === "/api/google-reviews") {
      return handleGoogleReviews(env, request);
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
  videosUrl.searchParams.set(
    "fields",
    "id,permalink_url,picture,created_time,description,width,height,likes.summary(true).limit(0)"
  );
  videosUrl.searchParams.set("limit", "30");
  videosUrl.searchParams.set("access_token", accessToken);

  const reelsUrl = new URL(`https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}/video_reels`);
  reelsUrl.searchParams.set(
    "fields",
    "id,permalink_url,picture,created_time,description,width,height,likes.summary(true).limit(0)"
  );
  reelsUrl.searchParams.set("limit", "30");
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

  const videos = [...byId.values()]
    .sort((a, b) => new Date(b.created_time) - new Date(a.created_time))
    .slice(0, 30)
    .map((video) => ({
      id: video.id,
      thumbnail: video.picture || null,
      permalinkUrl: toAbsoluteUrl(video.permalink_url),
      description: video.description || "",
      createdTime: video.created_time || null,
      width: video.width || null,
      height: video.height || null,
      likeCount: video.likes?.summary?.total_count ?? 0,
    }));

  return jsonResponse({ videos }, 200, {
    // Short edge/browser cache so the widget doesn't call the Graph API on
    // every single page load.
    "cache-control": "public, max-age=600",
  });
}

async function handleGoogleReviews(env, request) {
  const apiKey = env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return jsonResponse({ error: "Google Places API not configured" }, 503);
  }

  // Cloudflare's shared edge cache — unlike a plain Cache-Control response
  // header (which only governs each *visitor's own* browser cache), this is
  // actually shared across every visitor hitting this Cloudflare location,
  // so it's what actually keeps real Google API calls down to roughly once
  // a day total rather than once per visitor. Cache-Control below still
  // matters too: it's what `cache.put` reads to decide how long to keep it.
  const cache = caches.default;
  const cacheKey = new Request(new URL(request.url).toString(), request);
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const detailsUrl = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  detailsUrl.searchParams.set("place_id", GOOGLE_PLACE_ID);
  detailsUrl.searchParams.set("fields", "reviews");
  detailsUrl.searchParams.set("language", "de");
  detailsUrl.searchParams.set("key", apiKey);

  let response;
  try {
    response = await fetch(detailsUrl);
  } catch {
    return jsonResponse({ error: "Google Places API unreachable" }, 502);
  }

  if (!response.ok) {
    return jsonResponse({ error: "Google Places API request failed" }, 502);
  }

  const data = await response.json();
  if (data.status !== "OK") {
    return jsonResponse({ error: `Google Places API error: ${data.status}` }, 502);
  }

  const reviews = (data.result?.reviews || [])
    .filter((review) => review.rating >= MIN_REVIEW_RATING)
    .slice(0, 5)
    .map((review) => ({
      id: `${review.author_name}-${review.time}`,
      authorName: review.author_name,
      authorPhoto: review.profile_photo_url || null,
      rating: review.rating,
      relativeTime: review.relative_time_description,
      text: review.text || "",
    }));

  const result = jsonResponse({ reviews }, 200, {
    // A day — real reviews change rarely, and this is what keeps the actual
    // Google API cost near zero (see cache.match above).
    "cache-control": "public, max-age=86400",
  });
  await cache.put(cacheKey, result.clone());
  return result;
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
