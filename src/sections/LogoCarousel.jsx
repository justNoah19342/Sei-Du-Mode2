import { useEffect, useRef } from "react";
import SectionHeading from "../components/SectionHeading";
import SectionReveal from "../components/SectionReveal";
import { getSectionInfo } from "../lib/sectionRevealStore";
import { partners } from "../data/partners";
import styles from "./LogoCarousel.module.css";

const { index: SECTION_INDEX, color: SECTION_COLOR } = getSectionInfo("marken");

// Fixed, generous copy count instead of runtime-measuring "just enough" for
// the current viewport/zoom. That dynamic approach had to retarget the CSS
// animation's shift value whenever the count changed — a running CSS
// transition/animation doesn't restart when its target changes, it just
// retargets from its current position, which visibly jumped or gapped the
// strip. A copy count that never changes after mount needs a shift target
// that never changes either (a constant -50%, i.e. exactly one half of the
// track), so that whole bug class can't happen here anymore.
//
// Deliberately NOT sized for extreme zoom-out anymore — long transform
// distances are a known compositor tiling edge case, and both 7 copies
// (~21,000px total) and 4 copies (~12,000px) still visibly dropped tiles
// mid-scroll on real devices (cards blanking out, reappearing once the
// translateX value came back down near 0). 3 copies per half (~4,500px)
// comfortably covers any realistic monitor at 100% zoom — the priority the
// client actually asked for — while keeping the peak transform distance
// short enough that the artifact stops showing up. See also the
// will-change/backface-visibility hints on .track in the CSS, which force a
// dedicated compositor layer instead of one being promoted/recycled on the
// fly (the actual root cause).
const COPIES_PER_HALF = 3;
// Scales with COPIES_PER_HALF so the time-per-logo stays constant — the
// loop now travels COPIES_PER_HALF times the distance per cycle, so it
// needs COPIES_PER_HALF times as long to look the same speed as before.
const LOOP_DURATION_S = 36 * COPIES_PER_HALF;

function PartnerCard({ partner, hidden }) {
  return (
    <a
      className={styles.card}
      href={partner.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
      onClick={(e) => e.currentTarget.blur()}
    >
      {/* Eager, not lazy — every logo in this strip is going to scroll into
         view within seconds regardless, and native lazy-loading was
         deferring the fetch until each card neared the viewport, which
         showed up as a stall in the marquee the first time a not-yet-cached
         logo scrolled in. */}
      <img className={styles.logo} src={partner.logo} alt={hidden ? "" : partner.name} />
    </a>
  );
}

export default function LogoCarousel() {
  const trackRef = useRef(null);

  // Opening a partner link (target="_blank") leaves that card focused; some
  // browsers re-apply focus to it when the tab regains visibility after the
  // new tab closes/loses focus, which would re-trigger the focus-within
  // pause below and leave its glow ring stuck. Clearing focus once the tab
  // is visible again covers that regardless of which browser did the
  // re-focusing.
  useEffect(() => {
    const clearStaleFocus = () => {
      if (document.visibilityState !== "visible") return;
      const track = trackRef.current;
      if (track && track.contains(document.activeElement)) {
        document.activeElement.blur();
      }
    };
    document.addEventListener("visibilitychange", clearStaleFocus);
    window.addEventListener("focus", clearStaleFocus);
    return () => {
      document.removeEventListener("visibilitychange", clearStaleFocus);
      window.removeEventListener("focus", clearStaleFocus);
    };
  }, []);

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

      <div className={styles.viewport}>
        <div ref={trackRef} className={styles.track} style={{ animationDuration: `${LOOP_DURATION_S}s` }}>
          {Array.from({ length: COPIES_PER_HALF * 2 }, (_, copyIndex) =>
            partners.map((partner) => (
              <PartnerCard key={`${partner.name}-${copyIndex}`} partner={partner} hidden={copyIndex > 0} />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
