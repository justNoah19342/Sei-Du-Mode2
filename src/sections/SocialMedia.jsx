import { useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Play } from "@phosphor-icons/react";
import SectionHeading from "../components/SectionHeading";
import SectionReveal from "../components/SectionReveal";
import VideoCoverflow from "../components/VideoCoverflow";
import { useFacebookVideos } from "../hooks/useFacebookVideos";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { getSectionInfo } from "../lib/sectionRevealStore";
import styles from "./SocialMedia.module.css";

const { index: SECTION_INDEX, color: SECTION_COLOR } = getSectionInfo("social-media");
const SKELETON_COUNT = 5;
const ENTRANCE_DURATION = 0.6;
// Mirrors --ease-reveal's curve — hardcoded because Framer Motion transition
// configs are plain JS values, not CSS custom properties.
const ENTRANCE_EASE = [0.25, 0.46, 0.45, 0.94];
// Same spring config MobileWerteStack.jsx already uses elsewhere in this
// codebase — reused here (instead of inventing new numbers) for the
// Netflix-style hover-grow, so every "lively" motion on the site shares one
// feel. Spring overshoot (vs. a flat ease-out) is what reads as alive rather
// than stiff — a plain duration/ease curve never overshoots its target.
const HOVER_TRANSITION = { type: "spring", stiffness: 300, damping: 22 };

function VideoCard({ video, revealed, growth, onHoverStart, onHoverEnd }) {
  // Tracks whether the one-time scroll entrance has finished — after that,
  // layout changes (hover grow/shrink, a resize across breakpoints) use the
  // livelier spring instead of replaying the slower entrance slide.
  const [hasSettled, setHasSettled] = useState(false);
  const isStacked = !revealed;

  // The Netflix-style grow/shrink has to be driven by React state (flowing
  // into this inline flexGrow), not a plain CSS :hover rule — Framer
  // Motion's layout prop only detects a box-size change by re-measuring
  // around a React render, so a CSS-only resize it never rendered for was
  // silently invisible to it (confirmed: computed flex-grow updated, but
  // the box itself never resized until this was wired through state).
  const style = isStacked
    ? { position: "absolute", left: 0, top: 0, width: "20%", pointerEvents: "none" }
    : { flexGrow: growth };

  return (
    <motion.li
      layout
      className={styles.card}
      style={style}
      transition={hasSettled ? HOVER_TRANSITION : { duration: ENTRANCE_DURATION, ease: ENTRANCE_EASE }}
      onLayoutAnimationComplete={() => setHasSettled(true)}
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
      onFocus={onHoverStart}
      onBlur={onHoverEnd}
    >
      <a
        href={video.permalinkUrl || undefined}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.thumbLink}
        aria-label="Facebook-Video ansehen"
      >
        <div
          className={styles.thumb}
          style={video.thumbnail ? { backgroundImage: `url(${video.thumbnail})` } : undefined}
        >
          <span className={styles.playBadge}>
            <Play className={styles.playIcon} size={18} weight="fill" />
          </span>
        </div>
      </a>
    </motion.li>
  );
}

function FacebookVideoRow({ revealed, isStacked }) {
  const { status, videos } = useFacebookVideos();

  // "not configured" / errored / empty all collapse to the same "nothing to
  // show yet" state rather than a broken-looking empty grid — the Meta app +
  // Page token setup is a separate step from shipping this component.
  if (status === "error" || (status === "loaded" && videos.length === 0)) {
    return null;
  }

  if (status === "loading") {
    // Same skeleton grid regardless of breakpoint — a brief, content-agnostic
    // placeholder doesn't need the swipe carousel's interactivity.
    return (
      <ul className={styles.grid}>
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <li key={i} className={styles.card}>
            <div className={styles.thumb} />
          </li>
        ))}
      </ul>
    );
  }

  // ≤899px: horizontal swipe carousel (same touch+arrow mechanism as the
  // Sortiment section's CategoryCoverflow) instead of a cramped 1-/2-column
  // grid. The stack→slide grid entrance below is desktop-only, so the
  // carousel never needs a "revealed" gate — it has its own always-on
  // touch/click interaction instead of a one-time scroll reveal.
  if (isStacked) {
    return <VideoCoverflow videos={videos} />;
  }

  return <VideoGrid videos={videos} revealed={revealed} />;
}

function VideoGrid({ videos, revealed }) {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <ul className={styles.grid}>
      {videos.map((video) => {
        const growth = hoveredId === null ? 1 : hoveredId === video.id ? 1.9 : 0.82;
        return (
          <VideoCard
            key={video.id}
            video={video}
            revealed={revealed}
            growth={growth}
            onHoverStart={() => setHoveredId(video.id)}
            onHoverEnd={() => setHoveredId((current) => (current === video.id ? null : current))}
          />
        );
      })}
    </ul>
  );
}

export default function SocialMedia() {
  const sectionRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();
  // once:true — cards should only ever stack-then-slide the first time the
  // section is scrolled into view. amount matches useReveal.js's own
  // IntersectionObserver threshold (0.15) used elsewhere on the site.
  const isInView = useInView(sectionRef, { once: true, amount: 0.15 });
  // Sits on the <section> itself (not on the cards or their row) so it's a
  // pure function of scroll position, independent of whether the videos
  // have finished loading yet — a slow network resolving videos after the
  // section already scrolled past should render them straight into their
  // final position, not stack-then-slide late.
  const revealed = isInView || prefersReducedMotion;
  // Matches CategoryCoverflow's own stacked/desktop split in Sortiment.jsx —
  // below this width the swipe carousel takes over from the grid.
  const isStacked = useMediaQuery("(max-width: 899px)");

  return (
    <section id="social-media" ref={sectionRef} className={`${styles.section} section`}>
      <SectionReveal index={SECTION_INDEX} color={SECTION_COLOR} />
      <div className="container">
        <SectionHeading eyebrow="Facebook" title="Unser Social Media" align="center" />
        <FacebookVideoRow revealed={revealed} isStacked={isStacked} />
      </div>
    </section>
  );
}
