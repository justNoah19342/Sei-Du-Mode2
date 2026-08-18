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

export default function SectionColorBubble() {
  const wrapperRef = useRef(null);
  const [color, setColor] = useState(SECTION_COLORS[0].color);
  const isMobile = useMediaQuery("(max-width: 599px)");

  // Hidden once the current section has fully taken on its color — the bubble
  // "became" that color, so it has nothing left to show. Reappears the moment
  // a new section starts taking over (activeIndex changes) and hides again
  // once that one settles too.
  const [isHidden, setIsHidden] = useState(false);

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
      const bubbleRect = bubbleEl.getBoundingClientRect();

      for (let i = 0; i < SECTION_COLORS.length; i += 1) {
        const { id, color: sectionColor } = SECTION_COLORS[i];
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        // Only switch once the bubble sits fully inside the new section —
        // i.e. it's no longer overlapping the section before it, per the
        // "don't change until fully in the new section" requirement.
        if (rect.top <= bubbleRect.top && rect.bottom >= bubbleRect.bottom) {
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
  }, []);

  return (
    <div ref={wrapperRef} className={styles.wrapper} data-hidden={isHidden}>
      <Bubble color={color} size={isMobile ? 90 : 140} />
    </div>
  );
}
