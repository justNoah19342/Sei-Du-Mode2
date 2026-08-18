import { useEffect, useState } from "react";
import { sanityClient, isSanityConfigured } from "../lib/sanityClient";

const QUERY = `*[_type == "ankuendigungsbalken"][0]{ text, aktiv }`;

export function useAnnouncementBar() {
  const [state, setState] = useState({ status: "loading", data: null });

  useEffect(() => {
    if (!isSanityConfigured) {
      setState({ status: "not-configured", data: null });
      return;
    }

    let cancelled = false;

    sanityClient
      .fetch(QUERY)
      .then((data) => {
        if (!cancelled) setState({ status: "loaded", data });
      })
      .catch((error) => {
        if (!cancelled) setState({ status: "error", data: null, error });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
