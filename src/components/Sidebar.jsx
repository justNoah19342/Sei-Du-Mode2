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
const WIDE_QUERY = "(min-width: 1450px)";

function rectsOverlap(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

export default function Sidebar() {
  const activeId = useActiveSection(ids);
  const [collapsed, setCollapsed] = useState(false);
  // Above 1450px there's enough room to keep the sidebar permanently open —
  // the hover-driven collapse/expand exists only to save space on narrower
  // desktop viewports.
  const [isWide, setIsWide] = useState(
    () => typeof window !== "undefined" && window.matchMedia(WIDE_QUERY).matches
  );
  const [motifDimmed, setMotifDimmed] = useState(false);
  const handleNavClick = useNavigateToSection();
  const motifRef = useRef(null);
  const navListRef = useRef(null);
  const callCtaRef = useRef(null);

  useEffect(() => {
    const query = window.matchMedia(WIDE_QUERY);
    const handleChange = (e) => setIsWide(e.matches);
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  const effectiveCollapsed = collapsed && !isWide;

  // The dancer motif is pinned to the sidebar's bottom-left corner; on short
  // viewports the nav list / call button can slide down far enough to
  // overlap it. Measuring the actual boxes (rather than a fixed breakpoint)
  // means it only dims when a real collision happens, and un-dims again the
  // moment there's room.
  useEffect(() => {
    if (effectiveCollapsed) {
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
  }, [effectiveCollapsed, activeId]);

  return (
    <aside
      className={`${styles.sidebar} ${effectiveCollapsed ? styles.collapsed : ""}`}
      onMouseEnter={() => setCollapsed(false)}
      onMouseLeave={() => setCollapsed(true)}
    >
      {!isWide && (
        <button
          type="button"
          className={styles.touchToggle}
          onClick={() => setCollapsed((v) => !v)}
          aria-expanded={!effectiveCollapsed}
          aria-label={effectiveCollapsed ? "Navigation ausklappen" : "Navigation einklappen"}
        >
          <CaretLeft size={14} weight="bold" />
        </button>
      )}

      {/* Rendered outside the collapsed guard (unlike the rest of the
          sidebar content) so collapsing fades it out via CSS instead of an
          abrupt unmount. Dimming is applied inline rather than as a CSS
          class since it's a per-render computed value. */}
      <DancerMotif
        ref={motifRef}
        className={styles.motif}
        style={motifDimmed ? { opacity: 0.12, filter: "grayscale(1)" } : undefined}
      />

      {!effectiveCollapsed && (
        <>
          <BlobShape variant="glow" className={styles.blobGlow} />

          <div className={styles.logoWrap}>
            <Logo size="md" />
          </div>

          <hr className={styles.rule} />

          <nav aria-label="Hauptnavigation">
            <ul ref={navListRef} className={styles.navList}>
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

          <a ref={callCtaRef} href={contact.phoneHref} className={styles.callCta}>
            Jetzt anrufen
          </a>
        </>
      )}
    </aside>
  );
}
