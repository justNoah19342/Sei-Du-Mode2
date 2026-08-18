import BlobShape from "../components/BlobShape";
import DancerMotif from "../components/DancerMotif";
import { contact, selbstbeschreibung, address } from "../data/content";
import styles from "./Hero.module.css";

export default function Hero() {
  const scrollToKontakt = () => {
    document.getElementById("kontakt")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section id="start" className={`${styles.hero} section`}>
      <BlobShape variant="glow" className={styles.blobGlow} />
      <DancerMotif className={styles.motifLeft} />
      <DancerMotif className={styles.motifRight} />

      <div className={`container ${styles.inner}`}>
        <span className="eyebrow">SEI DU Mode · {address.city}</span>
        <h1 className={styles.headline}>
          Mode, in der du <em>ganz du selbst</em> bist.
        </h1>
        <p className={styles.tagline}>{selbstbeschreibung}</p>

        <div className={styles.ctaRow}>
          <a href={contact.phoneHref} className={styles.ctaPrimary}>
            Jetzt anrufen
          </a>
          <button className={styles.ctaSecondary} onClick={scrollToKontakt}>
            Zur Anfahrt →
          </button>
        </div>
      </div>
    </section>
  );
}
