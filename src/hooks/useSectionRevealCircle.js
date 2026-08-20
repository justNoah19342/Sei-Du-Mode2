import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getSectionRevealState, markSectionSettled, subscribeSectionReveal } from "../lib/sectionRevealStore";

// Buffer added to the computed radius so the circle's edge is fully outside
// the viewport at "revealed" — otherwise sub-pixel rounding can leave a
// hairline sliver of the un-revealed state visible at the farthest corner.
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

// Shared by SectionReveal (the background flood circle) and any other
// element that needs to grow/shrink in exact sync with it — e.g. a
// same-shaped clip-path on a duplicated heading. Both call this against
// their *own* ref, so each gets an origin already local to its own box,
// even though they're reading the same underlying bubble position/section
// index from the store.
//
// collapseOnHide: SectionReveal's own circle stays sized at the full
// (always-large) computeOrigin() radius in both directions and instead
// relies on its CSS `transform: scale(0)` to disappear — the box itself
// never shrinks, only its scale does, which is what makes the shrink
// animate smoothly. A clip-path consumer (FacebookHeading's white heading
// clone) has no such scale step: the clip-path radius *is* the animated
// value. Reusing the same always-large radius for its "hidden" target
// left the clip permanently covering the heading (r never came back down
// to 0), so pass collapseOnHide to target r:0 (keeping the fresh x/y so it
// still collapses toward wherever the bubble currently is) whenever this
// section un-reveals.
export function useSectionRevealCircle(index, elRef, { collapseOnHide = false } = {}) {
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

      const el = elRef.current;
      if (el) {
        const computed = computeOrigin(el, state);
        setOrigin(collapseOnHide && !nextRevealed ? { ...computed, r: 0 } : computed);
      }

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
  }, [index, elRef]);

  // The radius above is only recomputed on a section flip. Resizing the
  // window (e.g. narrowing it) without triggering a flip left the old,
  // now-too-small radius in place — visible as an uncovered corner sliver
  // of the un-revealed state. Re-measure on every resize too, using the
  // current (possibly unchanged) bubble position.
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const observer = new ResizeObserver(() => {
      setOrigin(computeOrigin(el, getSectionRevealState()));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [elRef]);

  return { revealed, instant, origin };
}

// Only SectionReveal's own background circle should broadcast "settled" —
// exported separately so a second circle-follower (like a heading clip)
// never double-fires it.
export { markSectionSettled };
