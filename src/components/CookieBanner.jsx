import { useCookieConsent } from "../hooks/useCookieConsent";
import styles from "./CookieBanner.module.css";

// Shows only while no decision has been made yet (consent === null) — once
// accepted or declined, useCookieConsent's stored value hides it for future
// visits too. Gates the Facebook video iframe (see FacebookVideoCard.jsx),
// the only non-essential/cookie-setting embed currently on the site.
export default function CookieBanner() {
  const { consent, accept, decline } = useCookieConsent();

  if (consent) return null;

  return (
    <div className={styles.banner} role="dialog" aria-live="polite" aria-label="Cookie-Einstellungen">
      <p className={styles.text}>
        Wir binden Facebook-Videos ein. Beim Laden eines Videos werden Daten an Facebook
        übertragen und Cookies gesetzt. Ohne deine Zustimmung bleiben diese Videos deaktiviert.
      </p>
      <div className={styles.actions}>
        <button type="button" className={styles.decline} onClick={decline}>
          Ablehnen
        </button>
        <button type="button" className={styles.accept} onClick={accept}>
          Akzeptieren
        </button>
      </div>
    </div>
  );
}
