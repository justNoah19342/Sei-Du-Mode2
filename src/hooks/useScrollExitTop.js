import { useEffect, useRef, useState } from "react";

// Tracks whether the observed element's top edge has scrolled above the
// viewport (i.e. it started exiting from the top and is no longer fully visible).
export function useScrollExitTop() {
  const ref = useRef(null);
  const [pastTop, setPastTop] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setPastTop(entry.boundingClientRect.top < 0);
      },
      { threshold: [0, 0.01, 0.5, 0.99, 1] }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, pastTop];
}
