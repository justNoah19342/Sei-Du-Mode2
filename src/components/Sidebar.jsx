import { useState } from "react";
import { CaretLeft } from "@phosphor-icons/react";
import Logo from "./Logo";
import BlobShape from "./BlobShape";
import DancerMotif from "./DancerMotif";
import NavLink from "./NavLink";
import { navItems } from "../data/navigation";
import { contact } from "../data/content";
import { useActiveSection } from "../hooks/useActiveSection";
import { useNavigateToSection } from "../hooks/useNavigateToSection";
import styles from "./Sidebar.module.css";

const ids = navItems.map((item) => item.id);
// Slight uneven rhythm between nav items — deliberate, not a uniform list.
const offsets = [0, 10, -4, 14];

export default function Sidebar() {
  const activeId = useActiveSection(ids);
  const [collapsed, setCollapsed] = useState(false);
  const handleNavClick = useNavigateToSection();

  return (
    <aside
      className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}
      onMouseEnter={() => setCollapsed(false)}
      onMouseLeave={() => setCollapsed(true)}
    >
      <button
        type="button"
        className={styles.touchToggle}
        onClick={() => setCollapsed((v) => !v)}
        aria-expanded={!collapsed}
        aria-label={collapsed ? "Navigation ausklappen" : "Navigation einklappen"}
      >
        <CaretLeft size={14} weight="bold" />
      </button>

      {!collapsed && (
        <>
          <BlobShape variant="glow" className={styles.blobGlow} />
          <BlobShape variant="primary" className={styles.blobTop} />
          <DancerMotif className={styles.motif} />

          <div className={styles.logoWrap}>
            <Logo size="md" />
          </div>

          <hr className={styles.rule} />

          <nav aria-label="Hauptnavigation">
            <ul className={styles.navList}>
              {navItems.map((item, i) => (
                <NavLink
                  key={item.id}
                  label={item.label}
                  isActive={activeId === item.id}
                  offset={offsets[i] ?? 0}
                  onClick={() => handleNavClick(item.id)}
                />
              ))}
            </ul>
          </nav>

          <a href={contact.phoneHref} className={styles.callCta}>
            Jetzt anrufen
          </a>
        </>
      )}
    </aside>
  );
}
