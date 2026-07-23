import SectionHeading from "../components/SectionHeading";
import MobileWerteStack from "../components/MobileWerteStack";
import { werte } from "../data/content";
import { useScrollExitTop } from "../hooks/useScrollExitTop";
import styles from "./UeberUns.module.css";

// TODO: Gruendungsjahr/Firmengeschichte ergaenzen, sobald Christina Details liefert.
// TODO: echte Kundenzitate/Testimonials einfuegen, sobald freigegeben — aktuell nicht gerendert.

export default function UeberUns() {
  const [lastCardRef, isPastTop] = useScrollExitTop();

  return (
    <section id="ueber-uns" className={`${styles.section} section`}>
      <div className="container">
        <SectionHeading eyebrow="Über uns" title="Der Name ist Programm" />

        <blockquote className={styles.pullQuote}>
          „SEI DU" heißt: Hier darfst du einfach du selbst sein, ob dein Stil
          zurückhaltend ist oder auffällig.
        </blockquote>

        <ul className={`${styles.werteGrid} ${isPastTop ? styles.flush : ""}`}>
          {werte.map((wert, i) => (
            <li
              key={wert.title}
              ref={i === werte.length - 1 ? lastCardRef : undefined}
              className={`${styles.werteCard} ${i % 2 === 1 ? styles.offset : ""}`}
            >
              <h3>{wert.title}</h3>
              <p>{wert.text}</p>
            </li>
          ))}
        </ul>

        <div className={styles.mobileStackWrap}>
          <MobileWerteStack items={werte} />
        </div>
      </div>
    </section>
  );
}
