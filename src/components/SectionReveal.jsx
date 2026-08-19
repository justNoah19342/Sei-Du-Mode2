import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getSectionRevealState, markSectionSettled, subscribeSectionReveal } from "../lib/sectionRevealStore";
import styles from "./SectionReveal.module.css";

// Buffer added to the computed radius so the circle's edge is fully outside
// the viewport at "revealed" — otherwise sub-pixel rounding can leave a hairline
// sliver of the section's original background visible at the farthest corner.
const RADIUS_BUFFER = 4;

function computeRevealed(index) {
  // "===" (not "<=") — exactly one section is ever colored at a time. Moving
  // on to any other section (forward or backward) un-reveals this one again.
  return index === getSectionRevealState().activeIndex;
}

function computeOrigin(el, state) {
  const rect = el.getBoundingClientRect();
  const x = state.bubbleX - rect.left;
  const y = state.bubbleY - rect.top;
  const dx = Math.max(x, rect.width - x);
  const dy = Math.max(y, rect.height - y);
  return { x, y, r: Math.sqrt(dx * dx + dy * dy) + RADIUS_BUFFER };
}

export default function SectionReveal({ index, color }) {
  const layerRef = useRef(null);
  const wasRevealedRef = useRef(computeRevealed(index));
  const [revealed, setRevealed] = useState(() => wasRevealedRef.current);
  // Only true for the very first (pre-paint) correction — see the comment
  // below. Every later real flip animates normally.
  const [instant, setInstant] = useState(true);
  const [origin, setOrigin] = useState({ x: 0, y: 0, r: 0 });

  // useLayoutEffect (not useEffect) so this runs in the same tick as
  // SectionColorBubble's own initial measurement, before the browser paints —
  // otherwise a page loaded already scrolled deep in (e.g. via a "/#kontakt"
  // link) would flash the wrong initial reveal state for one frame.
  useLayoutEffect(() => {
    const applyFlip = (state, isInitialSync) => {
      const nextRevealed = index === state.activeIndex;
      if (nextRevealed === wasRevealedRef.current) return;

      const el = layerRef.current;
      if (el) setOrigin(computeOrigin(el, state));

      setInstant(isInitialSync);
      wasRevealedRef.current = nextRevealed;
      setRevealed(nextRevealed);

      // A 0-duration (instant) transition never fires "transitionend", so a
      // page loaded already scrolled into this section's territory would
      // otherwise never tell the bubble "this section settled, hide me".
      if (isInitialSync && nextRevealed) markSectionSettled(index);
    };

    applyFlip(getSectionRevealState(), true);
    return subscribeSectionReveal((state) => applyFlip(state, false));
  }, [index]);

  // The radius above is only recomputed on a section flip. Resizing the
  // window (e.g. narrowing it) without triggering a flip left the old,
  // now-too-small radius in place — visible as an uncovered corner sliver
  // in the previous section's color. Re-measure on every resize too, using
  // the current (possibly unchanged) bubble position.
  useEffect(() => {
    const el = layerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(() => {
      setOrigin(computeOrigin(el, getSectionRevealState()));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleTransitionEnd = (e) => {
    // Only the completion of a real *grow* (not a shrink, not some other
    // animated property) means "this section now fully has its color" —
    // that's the moment the bubble should disappear into it.
    if (e.propertyName === "transform" && e.currentTarget.getAttribute("data-revealed") === "true") {
      markSectionSettled(index);
    }
  };

  return (
    <div className={styles.layer} ref={layerRef} aria-hidden="true">
      <div
        className={styles.circle}
        data-revealed={revealed}
        data-instant={instant}
        onTransitionEnd={handleTransitionEnd}
        style={{
          left: `${origin.x - origin.r}px`,
          top: `${origin.y - origin.r}px`,
          width: `${origin.r * 2}px`,
          height: `${origin.r * 2}px`,
          background: color,
        }}
      />
    </div>
  );
}
