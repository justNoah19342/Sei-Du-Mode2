import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Cookie } from "@phosphor-icons/react";
import { useCookieConsent } from "../hooks/useCookieConsent";
import styles from "./CookieBanner.module.css";

// Dark-background sections the icon needs to stay legible against — its own
// default look (dark circle, white icon) would otherwise disappear into
// them. Matched by id: #kontakt-map (OeffnungszeitenKontakt.jsx) and
// #footer (Footer.jsx).
const DARK_ZONE_IDS = ["kontakt-map", "footer"];

// True once the fixed-position icon's own screen rect overlaps any dark
// zone's rect — plain scroll/resize measurement (same technique as
// SectionColorBubble.jsx) rather than IntersectionObserver, since the
// target here is a `position: fixed` element that doesn't scroll with the
// page itself, only the dark zones do.
function useOverDarkZone(elRef, active) {
  const [overDark, setOverDark] = useState(false);

  useEffect(() => {
    if (!active) return undefined;
    const el = elRef.current;
    if (!el) return undefined;

    const update = () => {
      const btnRect = el.getBoundingClientRect();
      const isOver = DARK_ZONE_IDS.some((id) => {
        const zoneEl = document.getElementById(id);
        if (!zoneEl) return false;
        const zoneRect = zoneEl.getBoundingClientRect();
        return (
          btnRect.bottom > zoneRect.top &&
          btnRect.top < zoneRect.bottom &&
          btnRect.right > zoneRect.left &&
          btnRect.left < zoneRect.right
        );
      });
      setOverDark(isOver);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [elRef, active]);

  return overDark;
}

// Shows the full choice while no decision has been made yet (consent ===
// null) — same as before. Once a decision exists, instead of disappearing
// for good it collapses into a small corner icon (reopen) so the choice
// stays reachable/revocable later, as required alongside the original
// consent (withdrawing must be as easy as giving it).
export default function CookieBanner() {
  const { consent, accept, decline } = useCookieConsent();
  const [reopened, setReopened] = useState(false);
  const reopenButtonRef = useRef(null);
  const bannerRef = useRef(null);

  const showChoice = !consent || reopened;
  const overDarkIcon = useOverDarkZone(reopenButtonRef, !showChoice);
  const overDarkBanner = useOverDarkZone(bannerRef, showChoice);

  if (!showChoice) {
    return (
      <button
        ref={reopenButtonRef}
        type="button"
        className={styles.reopenButton}
        data-on-dark={overDarkIcon}
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
    <div
      ref={bannerRef}
      className={styles.banner}
      data-on-dark={overDarkBanner}
      role="dialog"
      aria-live="polite"
      aria-label="Cookie-Einstellungen"
    >
      <p className={styles.text}>
        Wir binden Facebook-Videos ein. Beim Laden eines Videos werden Daten an Facebook
        übertragen und Cookies gesetzt. Ohne deine Zustimmung bleiben diese Videos deaktiviert.
        Mehr dazu in unserer <Link to="/datenschutz" className={styles.link}>Datenschutzerklärung</Link>.
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
