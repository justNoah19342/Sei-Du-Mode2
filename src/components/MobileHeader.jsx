import { List, X } from "@phosphor-icons/react";
import Logo from "./Logo";
import styles from "./MobileHeader.module.css";

export default function MobileHeader({ isOpen, onToggle }) {
  return (
    <header className={styles.header}>
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
