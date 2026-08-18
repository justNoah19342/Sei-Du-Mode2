import { useEffect, useState } from "react";

// Hits the /api/facebook-videos route handled by the Worker (see
// worker/index.js) rather than the Meta Graph API directly — that's where
// the Page Access Token actually lives, server-side only.
export function useFacebookVideos() {
  const [state, setState] = useState({ status: "loading", videos: [] });

  useEffect(() => {
    let cancelled = false;

    fetch("/api/facebook-videos")
      .then((res) => {
        if (!res.ok) throw new Error(`facebook-videos request failed: ${res.status}`);
        return res.json();
      })
      .then(({ videos }) => {
        if (!cancelled) setState({ status: "loaded", videos: videos || [] });
      })
      .catch((error) => {
        if (!cancelled) setState({ status: "error", videos: [], error });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
