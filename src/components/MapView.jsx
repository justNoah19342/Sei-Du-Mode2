import { useEffect, useRef } from "react";
import { Map as MaplibreMap, Marker, Popup, NavigationControl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import styles from "./MapView.module.css";

// Adapted from a shadcn/Tailwind/TypeScript reference component into this
// project's plain React + CSS Modules stack (no Tailwind/shadcn/TS here).
// Simplified to a single static marker since we only ever show the shop's
// own location, not a list of markers.
const TILE_STYLES = {
  light: "https://tiles.openfreemap.org/styles/liberty",
  dark: "https://tiles.openfreemap.org/styles/dark",
};

// Geocoded via OpenStreetMap Nominatim for "Hauptstraße 61, 53819 Neunkirchen-Seelscheid".
const SHOP_COORDS = [7.3378908, 50.8440754];

export default function MapView() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const map = new MaplibreMap({
      container,
      style: prefersDark ? TILE_STYLES.dark : TILE_STYLES.light,
      center: SHOP_COORDS,
      zoom: 15,
      // Compact (not disabled) — OpenStreetMap/OpenFreeMap require attribution to stay visible.
      attributionControl: { compact: true },
    });

    map.addControl(new NavigationControl({ showCompass: false }), "top-right");

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
    />
  );
}
