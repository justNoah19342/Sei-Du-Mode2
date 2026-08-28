import { useEffect, useRef } from "react";
import { Map as MaplibreMap, Marker, Popup, NavigationControl, setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import styles from "./MapView.module.css";

// maplibre-gl's own worker bundle isn't discoverable by Vite's dep
// pre-bundler (its URL is resolved at runtime, not via a literal
// `new URL(...)` Vite can analyze), so it never gets emitted into the
// production build on its own. Worse, that worker file itself does a
// relative `import "./maplibre-gl-shared.mjs"` — if we copy just the worker
// via a hashed `?url` import, that sibling file's hashed name won't match
// the worker's hardcoded relative path and it 404s. So both files are
// copied verbatim (unhashed) into public/maplibre/ instead, keeping their
// original relative path to each other intact.
setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

// Adapted from a shadcn/Tailwind/TypeScript reference component into this
// project's plain React + CSS Modules stack (no Tailwind/shadcn/TS here).
// Simplified to a single static marker since we only ever show the shop's
// own location, not a list of markers.
// Always light by design, regardless of the visitor's device theme.
const TILE_STYLE = "https://tiles.openfreemap.org/styles/liberty";

// From the shop's own Google Maps place link for "Zeithstraße 131, 53819
// Neunkirchen-Seelscheid" — OpenStreetMap/Nominatim has no address point for
// this exact house number (it's a long street spanning several hamlets), so
// Google's own pin coordinates are used instead of a geocoded guess.
const SHOP_COORDS = [7.3248004, 50.8711177];

export default function MapView() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = new MaplibreMap({
      container,
      style: TILE_STYLE,
      center: SHOP_COORDS,
      zoom: 15,
      // Compact (not disabled) — OpenStreetMap/OpenFreeMap require attribution to stay visible.
      attributionControl: { compact: true },
    });

    map.addControl(new NavigationControl({ showCompass: false }), "top-right");

    // Surface style/tile/network failures instead of silently leaving a
    // blank map — MapLibre swallows these into an 'error' event rather than
    // throwing, so without this listener they're invisible in production.
    map.on("error", (e) => {
      console.error("MapLibre error:", e?.error || e);
    });

    // Guards against the container reporting the wrong size at construction
    // time (e.g. before webfonts load and shift layout) by re-measuring
    // whenever it actually changes, instead of only once on mount.
    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(container);

    const markerEl = document.createElement("div");
    markerEl.className = styles.marker;
    markerEl.setAttribute("aria-hidden", "true");

    const popup = new Popup({ offset: 18, closeButton: false, closeOnClick: false }).setText("SEI DU Mode");

    let isOpen = false;
    const openPopup = () => {
      if (isOpen) return;
      popup.setLngLat(SHOP_COORDS).addTo(map);
      isOpen = true;
    };
    const closePopup = () => {
      popup.remove();
      isOpen = false;
    };

    markerEl.addEventListener("mouseenter", openPopup);
    markerEl.addEventListener("mouseleave", closePopup);
    markerEl.addEventListener("click", () => (isOpen ? closePopup() : openPopup()));

    const marker = new Marker({ element: markerEl }).setLngLat(SHOP_COORDS).addTo(map);

    return () => {
      resizeObserver.disconnect();
      marker.remove();
      map.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={styles.map}
      role="img"
      aria-label="Karte mit dem Standort von SEI DU Mode in Neunkirchen-Seelscheid"
      data-map
    />
  );
}
