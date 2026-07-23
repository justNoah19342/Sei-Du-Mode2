import { useEffect, useState } from "react";
import { sanityClient, isSanityConfigured } from "../lib/sanityClient";

const QUERY = `*[_type == "produkt" && kategorie == $kategorie] | order(reihenfolge asc) {
  _id, name, beschreibung, image
}`;

export function useCategoryProducts(kategorie) {
  const [state, setState] = useState({ status: "loading", products: [] });

  useEffect(() => {
    if (!isSanityConfigured) {
      setState({ status: "not-configured", products: [] });
      return;
    }

    let cancelled = false;
    setState({ status: "loading", products: [] });

    sanityClient
      .fetch(QUERY, { kategorie })
      .then((products) => {
        if (!cancelled) setState({ status: "loaded", products });
      })
      .catch((error) => {
        if (!cancelled) setState({ status: "error", products: [], error });
      });

    return () => {
      cancelled = true;
    };
  }, [kategorie]);

  return state;
}
