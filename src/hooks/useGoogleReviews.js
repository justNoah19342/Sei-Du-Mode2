import { useEffect, useState } from "react";
import { googleReviewsPlaceholder } from "../data/googleReviewsPlaceholder";

// Hits the /api/google-reviews route handled by the Worker (see
// worker/index.js) — that's where the Google Places API key actually lives,
// server-side only, same reasoning as useFacebookVideos.
//
// Unlike useFacebookVideos (which just renders nothing when unconfigured),
// this always resolves to *some* reviews: real ones once the Worker has a
// key configured, otherwise the static placeholder set. That's deliberate —
// requested so the section looks finished immediately, and automatically
// switches over to real data the moment the key is added, with no further
// code change needed.
export function useGoogleReviews() {
  const [state, setState] = useState({ status: "loading", reviews: googleReviewsPlaceholder, isPlaceholder: true });

  useEffect(() => {
    let cancelled = false;

    fetch("/api/google-reviews")
      .then((res) => {
        if (!res.ok) throw new Error(`google-reviews request failed: ${res.status}`);
        return res.json();
      })
      .then(({ reviews }) => {
        if (cancelled) return;
        if (reviews && reviews.length > 0) {
          setState({ status: "loaded", reviews, isPlaceholder: false });
        } else {
          // Configured but genuinely nothing to show (e.g. every real review
          // is below the 4-star cutoff) — placeholders read better than an
          // empty section.
          setState({ status: "loaded", reviews: googleReviewsPlaceholder, isPlaceholder: true });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ status: "loaded", reviews: googleReviewsPlaceholder, isPlaceholder: true });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
