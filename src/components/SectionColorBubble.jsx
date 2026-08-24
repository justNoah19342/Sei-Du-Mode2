import { useLayoutEffect, useRef, useState } from "react";
import Bubble from "./Bubble";
import { useMediaQuery } from "../hooks/useMediaQuery";
import {
  SECTION_COLORS,
  getSectionRevealState,
  publishSectionReveal,
  subscribeSectionReveal,
} from "../lib/sectionRevealStore";
import styles from "./SectionColorBubble.module.css";

const BUBBLE_SIZE_DESKTOP = 140;
const BUBBLE_SIZE_MOBILE = 90;

function readCssPx(name) {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || 0;
}

export default function SectionColorBubble() {
  const wrapperRef = useRef(null);
  const [color, setColor] = useState(SECTION_COLORS[0].color);
  const isMobile = useMediaQuery("(max-width: 599px)");

  // Hidden once the current section has fully taken on its color — the bubble
  // "became" that color, so it has nothing left to show. Reappears the moment
  // a new section starts taking over (activeIndex changes) and hides again
  // once that one settles too.
  const [isHidden, setIsHidden] = useState(false);
  // Separate from isHidden above: true only on mobile, only once the bubble
  // is fully inside a `mobileNoReveal` section (currently just the footer).
  // While true, activeIndex is deliberately left pinned at Kontakt's index
  // (see the loop below) instead of advancing to the footer, so the footer
  // never gets flooded and the bubble simply disappears instead of
  // following it — reappearing the moment you scroll back into Kontakt.
  const [isBeyondNoRevealZone, setIsBeyondNoRevealZone] = useState(false);

  const activeIndexRef = useRef(0);

  useLayoutEffect(() => {
    setIsHidden(() => {
      const state = getSectionRevealState();
      return state.settledIndex === state.activeIndex;
    });
    return subscribeSectionReveal((state) => {
      setIsHidden(state.settledIndex === state.activeIndex);
    });
  }, []);

  useLayoutEffect(() => {
    const update = () => {
      const bubbleEl = wrapperRef.current;
      if (!bubbleEl) return;

      // Vertical position tracks overall page scroll progress: at the top of
      // the page it sits at its usual top offset, at the bottom of the page
      // it sits the mirrored distance up from the viewport's bottom edge,
      // moving linearly with scrollY in between (so "middle of the page"
      // puts it roughly mid-viewport). Set before reading bubbleRect below
      // so the section-containment check further down uses the bubble's
      // actual on-screen position for this frame, not last frame's.
      const margin = readCssPx(isMobile ? "--space-3" : "--space-5");
      const headerOffset = readCssPx("--announcement-height") + readCssPx("--mobile-header-height");
      const bubbleSize = isMobile ? BUBBLE_SIZE_MOBILE : BUBBLE_SIZE_DESKTOP;
      const topOffset = headerOffset + margin;
      const bottomOffset = margin;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
      const travel = Math.max(0, window.innerHeight - bubbleSize - topOffset - bottomOffset);
      bubbleEl.style.top = `${topOffset + progress * travel}px`;

      const bubbleRect = bubbleEl.getBoundingClientRect();

      for (let i = 0; i < SECTION_COLORS.length; i += 1) {
        const { id, color: sectionColor, mobileNoReveal } = SECTION_COLORS[i];
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        // Only switch once the bubble sits fully inside the new section —
        // i.e. it's no longer overlapping the section before it, per the
        // "don't change until fully in the new section" requirement.
        if (rect.top <= bubbleRect.top && rect.bottom >= bubbleRect.bottom) {
          if (isMobile && mobileNoReveal) {
            // Deliberately skip setColor/publishSectionReveal here — leaving
            // activeIndex pinned at whatever section was active before (e.g.
            // Kontakt) means that section just stays in its already-settled
            // revealed state, and this one (the footer) never receives its
            // own flood. The bubble itself hides via isBeyondNoRevealZone,
            // independent of the isHidden/settled mechanism above.
            setIsBeyondNoRevealZone(true);
            break;
          }
          setIsBeyondNoRevealZone(false);
          setColor((current) => (current === sectionColor ? current : sectionColor));

          // Drives SectionReveal's circular reveal — kept independent of the
          // color dedup above, since two adjacent sections can legitimately
          // share a color (e.g. "start"/"marken" are both white) while still
          // being distinct geometric sections that each need their own
          // reveal/un-reveal.
          if (i !== activeIndexRef.current) {
            publishSectionReveal({
              activeIndex: i,
              prevIndex: activeIndexRef.current,
              bubbleX: bubbleRect.left + bubbleRect.width / 2,
              bubbleY: bubbleRect.top + bubbleRect.height / 2,
            });
            activeIndexRef.current = i;
          }
          break;
        }
      }
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [isMobile]);

  return (
    <div ref={wrapperRef} className={styles.wrapper} data-hidden={isHidden || isBeyondNoRevealZone}>
      <Bubble color={color} size={isMobile ? 90 : 140} />
    </div>
  );
}
