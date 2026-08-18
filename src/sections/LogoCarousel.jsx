import SectionHeading from "../components/SectionHeading";
import SectionReveal from "../components/SectionReveal";
import { getSectionInfo } from "../lib/sectionRevealStore";
import { partners } from "../data/partners";
import styles from "./LogoCarousel.module.css";

const { index: SECTION_INDEX, color: SECTION_COLOR } = getSectionInfo("marken");

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
        <div className={styles.track}>
          {partners.map((partner) => (
            <PartnerCard key={partner.name} partner={partner} />
          ))}
          {partners.map((partner) => (
            <PartnerCard key={`${partner.name}-dup`} partner={partner} hidden />
          ))}
        </div>
      </div>
    </section>
  );
}
