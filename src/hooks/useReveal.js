import { useEffect, useRef } from "react";

// Applies the .is-visible class (see global.css .reveal) when an element scrolls
// into view. Timings sourced from ui-ux-pro-max's gsap "Scroll Reveal" preset.
export function useReveal() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}
