import { useEffect, useRef } from "react";
import { List, X } from "@phosphor-icons/react";
import Logo from "./Logo";
import styles from "./MobileHeader.module.css";

const HEIGHT_VAR = "--mobile-header-height";

export default function MobileHeader({ isOpen, onToggle }) {
  const headerRef = useRef(null);

  // SectionColorBubble reads this to sit below the header on mobile instead
  // of overlapping it — collapses to 0 automatically once the header is
  // display:none (its rect height becomes 0 above the 899px breakpoint).
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const update = () => {
      document.documentElement.style.setProperty(HEIGHT_VAR, `${el.getBoundingClientRect().height}px`);
    };
    update();

    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(el);
    window.addEventListener("resize", update);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <header className={styles.header} ref={headerRef}>
      <Logo size="sm" />
      <button
        className={styles.toggle}
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls="mobile-drawer"
        aria-label={isOpen ? "Menü schließen" : "Menü öffnen"}
      >
        {isOpen ? <X size={24} weight="bold" /> : <List size={24} weight="bold" />}
      </button>
    </header>
  );
}
