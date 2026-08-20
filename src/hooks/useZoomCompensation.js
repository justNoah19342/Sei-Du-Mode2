import { useEffect, useState } from "react";

// Chrome/Edge/Firefox scale window.devicePixelRatio proportionally with page
// zoom (Ctrl +/-), so comparing it against the value captured when this
// component first mounted gives a relative zoom factor. Returns a CSS scale
// that counteracts that factor, so an element wrapped with it keeps rendering
// at the on-screen size it had when it first appeared, regardless of zoom
// changes afterwards. Safari doesn't move devicePixelRatio on page zoom, so
// there this is a no-op (always 1) rather than actively wrong.
export function useZoomCompensation() {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const baseline = window.devicePixelRatio;
    if (!baseline) return undefined;

    // devicePixelRatio has no change event of its own — a matchMedia query
    // pinned to its current value fires once the ratio moves away from that
    // value, and we re-arm it against the new value after every firing.
    let mql;
    const subscribe = () => {
      mql = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      mql.addEventListener("change", onChange);
    };
    function onChange() {
      const ratio = window.devicePixelRatio / baseline;
      setScale(ratio > 0 ? 1 / ratio : 1);
      mql.removeEventListener("change", onChange);
      subscribe();
    }
    subscribe();

    return () => mql.removeEventListener("change", onChange);
  }, []);

  return scale;
}
