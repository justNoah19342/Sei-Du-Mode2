import { useEffect, useRef } from "react";
import Logo from "./Logo";
import BlobShape from "./BlobShape";
import NavLink from "./NavLink";
import { navItems } from "../data/navigation";
import { contact } from "../data/content";
import { useActiveSection } from "../hooks/useActiveSection";
import { useNavigateToSection } from "../hooks/useNavigateToSection";
import styles from "./MobileDrawer.module.css";

const ids = navItems.map((item) => item.id);

export default function MobileDrawer({ isOpen, onClose }) {
  const activeId = useActiveSection(ids);
  const navigateToSection = useNavigateToSection();
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
      const handleKeyDown = (e) => {
        if (e.key === "Escape") onClose();
      };
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "";
      };
    }
  }, [isOpen, onClose]);

  const handleNavClick = (id) => {
    onClose();
    navigateToSection(id);
  };

  return (
    <div
      id="mobile-drawer"
      className={`${styles.drawer} ${isOpen ? styles.open : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation"
      inert={!isOpen}
    >
      <BlobShape variant="glow" className={styles.blobGlow} />
      <div className={styles.topRow}>
        <Logo size="sm" />
        <button ref={closeButtonRef} className={styles.close} onClick={onClose} aria-label="Menü schließen">
          ✕
        </button>
      </div>
      <nav aria-label="Mobile Hauptnavigation">
        <ul className={styles.navList}>
          {navItems.map((item) => (
            <NavLink
              key={item.id}
              label={item.label}
              isActive={activeId === item.id}
              onClick={() => handleNavClick(item.id)}
            />
          ))}
        </ul>
      </nav>
      <a href={contact.phoneHref} className={styles.callCta}>
        Jetzt anrufen
      </a>
    </div>
  );
}
