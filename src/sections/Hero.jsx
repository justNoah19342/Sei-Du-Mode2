import { useState } from "react";
import BlobShape from "../components/BlobShape";
import DancerMotif from "../components/DancerMotif";
import { contact, selbstbeschreibung, address } from "../data/content";
import videoHerrenjacken from "../assets/hintergrundvideos/web/herrenjacken.mp4";
import videoKleidungsstaender from "../assets/hintergrundvideos/web/kleidungsstaender-schwenk.mp4";
import videoPullover from "../assets/hintergrundvideos/web/pullover.mp4";
import videoHemden from "../assets/hintergrundvideos/web/hemden.mp4";
import styles from "./Hero.module.css";

// herrenjacken.mp4 is the one clip kept from the original batch; the other
// three are the client's newer replacement footage. Compressed versions live
// in hintergrundvideos/web/; originals are untouched.
const BG_VIDEOS = [videoHerrenjacken, videoKleidungsstaender, videoPullover, videoHemden];

export default function Hero() {
  const [videoIndex, setVideoIndex] = useState(0);

  const scrollToKontakt = () => {
    document.getElementById("kontakt")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section id="start" className={`${styles.hero} section`}>
      {/* Barely-there texture, not a focal element — kept at ~2.5% opacity
         per client direction so it reads as depth rather than a video. */}
      <video
        key={BG_VIDEOS[videoIndex]}
        className={styles.bgVideo}
        autoPlay
        muted
        playsInline
        aria-hidden="true"
        onEnded={() => setVideoIndex((i) => (i + 1) % BG_VIDEOS.length)}
      >
        <source src={BG_VIDEOS[videoIndex]} type="video/mp4" />
      </video>
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
