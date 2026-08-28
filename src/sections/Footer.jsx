import { FacebookLogo, InstagramLogo } from "@phosphor-icons/react";
import Logo from "../components/Logo";
import { address, contact, openingHours, social, googleReviewHref, googleMapsDirectionsHref } from "../data/content";
import styles from "./Footer.module.css";

// TODO: Hausnummer vor Launch mit Christina abgleichen (siehe Kommentar in
// OeffnungszeitenKontakt.jsx — "Hauptstraße 61" vs. "Hauptstraße 61-63").
// TODO: Impressum- und Datenschutz-Seiten mit rechtlich geprueftem Text ergaenzen
// (gesetzlich vorgeschrieben fuer gewerbliche Websites in Deutschland).

export default function Footer() {
  return (
    <footer id="footer" className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.brandCol}>
          <Logo size="sm" onDark />
          <a href={googleMapsDirectionsHref} target="_blank" rel="noopener noreferrer" className={styles.address}>
            {address.full}
          </a>
        </div>

        <div>
          <h3 className={styles.heading}>Kontakt</h3>
          <p>
            <a href={contact.phoneHref}>{contact.phone}</a>
          </p>
          <p>
            <a href={contact.emailHref}>{contact.email}</a>
          </p>
          <a href={social.facebook} className={styles.socialLink} target="_blank" rel="noopener noreferrer">
            <span className={styles.iconChip}>
              <FacebookLogo size={18} weight="fill" />
            </span>
            Facebook
          </a>
          <a href={social.instagram} className={styles.socialLink} target="_blank" rel="noopener noreferrer">
            <span className={styles.iconChip}>
              <InstagramLogo size={18} weight="fill" />
            </span>
            Instagram
          </a>
        </div>

        <div>
          <h3 className={styles.heading}>Öffnungszeiten</h3>
          {openingHours.map((row) => (
            <p key={row.days}>
              {row.days}:
              <br />
              {row.hours}
            </p>
          ))}
        </div>

        <div>
          <h3 className={styles.heading}>Mehr</h3>
          <a href={googleReviewHref} className={styles.link}>
            Google-Bewertungen ansehen
          </a>
          <a href={googleMapsDirectionsHref} target="_blank" rel="noopener noreferrer" className={styles.link}>
            Route zum Laden anzeigen
          </a>
          <a href="/impressum" className={styles.link}>
            Impressum
          </a>
          <a href="/datenschutz" className={styles.link}>
            Datenschutz
          </a>
        </div>
      </div>

      <p className={styles.copyright}>© {new Date().getFullYear()} SEI DU Mode, Christina Ley</p>
    </footer>
  );
}
