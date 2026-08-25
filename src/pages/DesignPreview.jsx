import { useState } from "react";
import DancerMotif from "../components/DancerMotif";
import { selbstbeschreibung, address } from "../data/content";
import videoHerrenjacken from "../assets/hintergrundvideos/web/herrenjacken.mp4";
import videoKleidungsstaender from "../assets/hintergrundvideos/web/kleidungsstaender-schwenk.mp4";
import videoPullover from "../assets/hintergrundvideos/web/pullover.mp4";
import videoHemden from "../assets/hintergrundvideos/web/hemden.mp4";
import styles from "./DesignPreview.module.css";

// Compressed (see web/ subfolder — originals in hintergrundvideos/ are the
// untouched client-supplied stock clips). herrenjacken.mp4 is the one clip
// kept from the original batch; the rest is the client's newer footage.
const BG_VIDEOS = [videoHerrenjacken, videoKleidungsstaender, videoPullover, videoHemden];

// Rough side-by-side mockups of the 5 hero directions proposed in chat —
// A/B/C need real photography later, D/E work with graphics only. This page
// exists purely for the client to compare and pick a direction; not part of
// the real site flow (no nav link to it).
function PhotoPlaceholder({ label, className = "" }) {
  return (
    <div className={`${styles.photoPlaceholder} ${className}`}>
      <span>{label}</span>
    </div>
  );
}

function LabelTag({ letter, name, source }) {
  return (
    <div className={styles.labelTag}>
      <span className={styles.labelLetter}>{letter}</span>
      <div>
        <div className={styles.labelName}>{name}</div>
        {source && <div className={styles.labelSource}>{source}</div>}
      </div>
    </div>
  );
}

function HeroA() {
  return (
    <section className={`${styles.heroSection} ${styles.heroA}`}>
      <LabelTag letter="A" name="Editorial-Kampagne" source="Nike-Stil — Foto nötig" />
      <PhotoPlaceholder label="Foto-Platzhalter: Kampagnenbild (Outfit/Model, ganzflächig)" className={styles.photoFull} />
      <div className={styles.aOverlay}>
        <span className={styles.eyebrowLight}>SEI DU Mode · {address.city}</span>
        <h1 className={styles.headlineA}>Mode, in der du ganz du selbst bist.</h1>
      </div>
    </section>
  );
}

function HeroA2() {
  const [videoIndex, setVideoIndex] = useState(0);

  return (
    <section className={`${styles.heroSection} ${styles.heroA}`}>
      <LabelTag letter="A2" name="Video-Hintergrund, dezent" source="Eure Stock-Clips, gedimmt + Overlay" />
      <video
        key={BG_VIDEOS[videoIndex]}
        className={styles.bgVideo}
        autoPlay
        muted
        playsInline
        onEnded={() => setVideoIndex((i) => (i + 1) % BG_VIDEOS.length)}
      >
        <source src={BG_VIDEOS[videoIndex]} type="video/mp4" />
      </video>
      <div className={styles.aOverlay}>
        <span className={styles.eyebrowLight}>SEI DU Mode · {address.city}</span>
        <h1 className={styles.headlineA}>Mode, in der du ganz du selbst bist.</h1>
      </div>
    </section>
  );
}

function HeroB() {
  return (
    <section className={`${styles.heroSection} ${styles.heroB}`}>
      <LabelTag letter="B" name="Produktfoto minimalistisch" source="STAUD-Stil — Foto nötig" />
      <div className={styles.bGrid}>
        <div className={styles.bText}>
          <span className="eyebrow">SEI DU Mode · {address.city}</span>
          <h1 className={styles.headlineB}>
            Mode, in der du <em>ganz du selbst</em> bist.
          </h1>
          <p className={styles.tagline}>{selbstbeschreibung}</p>
          <div className={styles.ctaRow}>
            <span className={styles.ctaPrimary}>Jetzt anrufen</span>
            <span className={styles.ctaSecondary}>Zur Anfahrt →</span>
          </div>
        </div>
        <PhotoPlaceholder label="Foto-Platzhalter: freigestelltes Outfit" className={styles.photoBox} />
      </div>
    </section>
  );
}

function HeroC() {
  return (
    <section className={`${styles.heroSection} ${styles.heroC}`}>
      <LabelTag letter="C" name="Split-Screen / Slider" source="Rino-Pelle / Paolita-Stil — 3–4 Fotos nötig" />
      <div className={styles.cGrid}>
        <div className={styles.cText}>
          <span className="eyebrow">SEI DU Mode · {address.city}</span>
          <h1 className={styles.headlineB}>Neue Looks für den Herbst.</h1>
          <p className={styles.tagline}>{selbstbeschreibung}</p>
          <div className={styles.ctaRow}>
            <span className={styles.ctaPrimary}>Jetzt anrufen</span>
          </div>
        </div>
        <div className={styles.cSliderWrap}>
          <PhotoPlaceholder label="Foto-Platzhalter: Look 1/3" className={styles.photoBox} />
          <div className={styles.sliderDots}>
            <span className={styles.dotActive} />
            <span className={styles.dot} />
            <span className={styles.dot} />
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroD() {
  return (
    <section className={`${styles.heroSection} ${styles.heroD}`}>
      <LabelTag letter="D" name="Typografie + Muster" source="Miro-Stil — kein Foto nötig" />
      <div className={styles.dPattern} aria-hidden="true">
        {Array.from({ length: 24 }, (_, i) => (
          <DancerMotif key={i} className={styles.dMotifTile} />
        ))}
      </div>
      <div className={styles.dContent}>
        <span className="eyebrow">SEI DU Mode · {address.city}</span>
        <h1 className={styles.headlineD}>
          Mode, in der du <em>ganz du selbst</em> bist.
        </h1>
        <p className={styles.tagline}>{selbstbeschreibung}</p>
      </div>
    </section>
  );
}

function HeroE() {
  return (
    <section className={`${styles.heroSection} ${styles.heroE}`}>
      <LabelTag letter="E" name="Illustrativ-verspielt" source="Bestehendes Dancer-Motiv, verstärkt" />
      <div className={styles.eGrid}>
        <div className={styles.eText}>
          <span className="eyebrow">SEI DU Mode · {address.city}</span>
          <h1 className={styles.headlineB}>
            Mode, in der du <em>ganz du selbst</em> bist.
          </h1>
          <p className={styles.tagline}>{selbstbeschreibung}</p>
          <div className={styles.ctaRow}>
            <span className={styles.ctaPrimary}>Jetzt anrufen</span>
            <span className={styles.ctaSecondary}>Zur Anfahrt →</span>
          </div>
        </div>
        <DancerMotif className={styles.eMotifBig} />
      </div>
    </section>
  );
}

export default function DesignPreview() {
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1>Hero-Design-Vorschau</h1>
        <p>5 grobe Richtungen zum Vergleich — nicht die echte Seite, nur zur Auswahl.</p>
      </header>
      <HeroA />
      <HeroA2 />
      <HeroB />
      <HeroC />
      <HeroD />
      <HeroE />
    </div>
  );
}
