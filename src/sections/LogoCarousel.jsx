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
// track), so that whole bug class can't happen here anymore. 4 copies per
// half (14 total, ~12,600px of logos) comfortably covers even a very wide
// effective viewport, e.g. the ~5x-wider CSS viewport from zooming out to
// 20% — the animation only ever shifts up to -50%, so it's specifically
// *one half's* width that has to be at least as wide as the widest
// realistic viewport, not the track's total width.
const COPIES_PER_HALF = 7;
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
        <div className={styles.track} style={{ animationDuration: `${LOOP_DURATION_S}s` }}>
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
