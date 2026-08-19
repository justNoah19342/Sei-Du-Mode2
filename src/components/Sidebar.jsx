import { useEffect, useRef, useState } from "react";
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

function rectsOverlap(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

export default function Sidebar() {
  const activeId = useActiveSection(ids);
  const [collapsed, setCollapsed] = useState(false);
  const [motifDimmed, setMotifDimmed] = useState(false);
  const handleNavClick = useNavigateToSection();
  const motifRef = useRef(null);
  const navListRef = useRef(null);
  const callCtaRef = useRef(null);

  // The dancer motif is pinned to the sidebar's bottom-left corner; on short
  // viewports the nav list / call button can slide down far enough to
  // overlap it. Measuring the actual boxes (rather than a fixed breakpoint)
  // means it only dims when a real collision happens, and un-dims again the
  // moment there's room.
  useEffect(() => {
    if (collapsed) {
      setMotifDimmed(false);
      return;
    }

    const checkOverlap = () => {
      const motif = motifRef.current;
      const navList = navListRef.current;
      const callCta = callCtaRef.current;
      if (!motif || !navList || !callCta) return;
      const motifRect = motif.getBoundingClientRect();
      setMotifDimmed(
        rectsOverlap(motifRect, navList.getBoundingClientRect()) ||
          rectsOverlap(motifRect, callCta.getBoundingClientRect())
      );
    };

    checkOverlap();
    const observer = new ResizeObserver(checkOverlap);
    observer.observe(document.documentElement);
    return () => observer.disconnect();
  }, [collapsed, activeId]);

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

      {/* Rendered outside the collapsed guard (unlike the rest of the
          sidebar content) so collapsing fades it out via CSS instead of an
          abrupt unmount. Dimming is applied inline rather than as a CSS
          class since it's a per-render computed value. */}
      <DancerMotif
        ref={motifRef}
        className={styles.motif}
        style={motifDimmed ? { opacity: 0.12, filter: "grayscale(1)" } : undefined}
      />

      {!collapsed && (
        <>
          <BlobShape variant="glow" className={styles.blobGlow} />
          <BlobShape variant="primary" className={styles.blobTop} />

          <div className={styles.logoWrap}>
            <Logo size="md" />
          </div>

          <hr className={styles.rule} />

          <nav aria-label="Hauptnavigation">
            <ul ref={navListRef} className={styles.navList}>
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

          <a ref={callCtaRef} href={contact.phoneHref} className={styles.callCta}>
            Jetzt anrufen
          </a>
        </>
      )}
    </aside>
  );
}
