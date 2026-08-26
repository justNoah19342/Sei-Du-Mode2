import { useState } from "react";
import { Cookie } from "@phosphor-icons/react";
import { useCookieConsent } from "../hooks/useCookieConsent";
import styles from "./CookieBanner.module.css";

// Shows the full choice while no decision has been made yet (consent ===
// null) — same as before. Once a decision exists, instead of disappearing
// for good it collapses into a small corner icon (reopen) so the choice
// stays reachable/revocable later, as required alongside the original
// consent (withdrawing must be as easy as giving it).
export default function CookieBanner() {
  const { consent, accept, decline } = useCookieConsent();
  const [reopened, setReopened] = useState(false);

  const showChoice = !consent || reopened;

  if (!showChoice) {
    return (
      <button
        type="button"
        className={styles.reopenButton}
        onClick={() => setReopened(true)}
        aria-label="Cookie-Einstellungen öffnen"
      >
        <Cookie size={22} weight="fill" />
      </button>
    );
  }

  const handleAccept = () => {
    accept();
    setReopened(false);
  };

  const handleDecline = () => {
    decline();
    setReopened(false);
  };

  return (
    <div className={styles.banner} role="dialog" aria-live="polite" aria-label="Cookie-Einstellungen">
      <p className={styles.text}>
        Wir binden Facebook-Videos ein. Beim Laden eines Videos werden Daten an Facebook
        übertragen und Cookies gesetzt. Ohne deine Zustimmung bleiben diese Videos deaktiviert.
      </p>
      <div className={styles.actions}>
        <button type="button" className={styles.decline} onClick={handleDecline}>
          Ablehnen
        </button>
        <button type="button" className={styles.accept} onClick={handleAccept}>
          Akzeptieren
        </button>
      </div>
    </div>
  );
}
