import { useLayoutEffect, useRef, useState } from "react";
import SectionHeading from "../components/SectionHeading";
import SectionReveal from "../components/SectionReveal";
import { getSectionInfo } from "../lib/sectionRevealStore";
import { partners } from "../data/partners";
import styles from "./LogoCarousel.module.css";

const { index: SECTION_INDEX, color: SECTION_COLOR } = getSectionInfo("marken");

function PartnerCard({ partner, hidden, cardRef }) {
  return (
    <a
      ref={cardRef}
      className={styles.card}
      href={partner.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
      onClick={(e) => e.currentTarget.blur()}
    >
      <img
        className={styles.logo}
        src={partner.logo}
        alt={hidden ? "" : partner.name}
        loading="lazy"
      />
    </a>
  );
}

export default function LogoCarousel() {
  const viewportRef = useRef(null);
  // Plain object refs (not an array rebuilt every render) — the gap between
  // copy 0 and copy 1's first card is exactly "one set's width, gap
  // included", which is both the animation's loop distance and the unit
  // used to work out how many copies are needed to cover the viewport.
  // These two copies always exist once copies >= 2, and their key stays
  // stable across re-renders, so the refs stay attached without ever
  // bouncing through null — unlike an array reset in the render body, which
  // raced the resize listener and intermittently read it as empty.
  const firstCardRef = useRef(null);
  const secondCardRef = useRef(null);

  // Rendering only 2 copies (like a normal marquee) leaves gaps once the
  // effective viewport is wider than two logo-sets — e.g. zoomed out to
  // 20%, which turns into a 5x wider CSS viewport. So instead of a fixed
  // duplicate count, copies and shiftPx are both measured from the live
  // DOM and recalculated on resize/zoom, always keeping enough repeats to
  // fill the screen edge-to-edge.
  const [copies, setCopies] = useState(2);
  const [shiftPx, setShiftPx] = useState(null);

  useLayoutEffect(() => {
    const measure = () => {
      const first = firstCardRef.current;
      const second = secondCardRef.current;
      if (!first || !second) return;
      const advance = second.getBoundingClientRect().left - first.getBoundingClientRect().left;
      if (advance <= 0) return;
      setShiftPx(advance);

      const viewportWidth = viewportRef.current?.getBoundingClientRect().width ?? window.innerWidth;
      // +1 extra copy so the trailing edge is always covered mid-loop, not
      // just at rest.
      const needed = Math.max(2, Math.ceil(viewportWidth / advance) + 1);
      setCopies((current) => (current === needed ? current : needed));
    };

    measure();

    const resizeObserver = new ResizeObserver(measure);
    if (viewportRef.current) resizeObserver.observe(viewportRef.current);
    window.addEventListener("resize", measure);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [copies]);

  return (
    <section id="marken" className={`${styles.section} section`}>
      <SectionReveal index={SECTION_INDEX} color={SECTION_COLOR} />
      <div className="container">
        <SectionHeading
          eyebrow="Marken"
          title="Marken, die wir führen"
          align="center"
        />
      </div>

      <div className={styles.viewport} ref={viewportRef}>
        <div
          className={styles.track}
          style={shiftPx ? { "--marquee-shift": `${shiftPx}px` } : undefined}
        >
          {Array.from({ length: copies }, (_, copyIndex) =>
            partners.map((partner, partnerIndex) => {
              let cardRef;
              if (partnerIndex === 0) {
                if (copyIndex === 0) cardRef = firstCardRef;
                else if (copyIndex === 1) cardRef = secondCardRef;
              }
              return (
                <PartnerCard
                  key={`${partner.name}-${copyIndex}`}
                  partner={partner}
                  hidden={copyIndex > 0}
                  cardRef={cardRef}
                />
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
