import { useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Play } from "@phosphor-icons/react";
import SectionHeading from "../components/SectionHeading";
import SectionReveal from "../components/SectionReveal";
import VideoCoverflow from "../components/VideoCoverflow";
import { useFacebookVideos } from "../hooks/useFacebookVideos";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { useSectionRevealCircle } from "../hooks/useSectionRevealCircle";
import { getSectionInfo } from "../lib/sectionRevealStore";
import styles from "./SocialMedia.module.css";

const { index: SECTION_INDEX, color: SECTION_COLOR } = getSectionInfo("social-media");
const SKELETON_COUNT = 5;
const ENTRANCE_DURATION = 0.6;
// Mirrors --ease-reveal's curve — hardcoded because Framer Motion transition
// configs are plain JS values, not CSS custom properties.
const ENTRANCE_EASE = [0.25, 0.46, 0.45, 0.94];

function VideoCard({ video, revealed }) {
  // Tracks whether the one-time scroll entrance has finished, so a later
  // layout change (e.g. resizing the window across a grid breakpoint) snaps
  // instantly instead of replaying the slide — layout stays "live" for the
  // component's whole lifetime otherwise.
  const [hasSettled, setHasSettled] = useState(false);
  const isStacked = !revealed;

  return (
    <motion.li
      layout
      className={styles.card}
      style={isStacked ? { gridColumn: 1, gridRow: 1, pointerEvents: "none" } : undefined}
      transition={hasSettled ? { duration: 0 } : { duration: ENTRANCE_DURATION, ease: ENTRANCE_EASE }}
      onLayoutAnimationComplete={() => setHasSettled(true)}
    >
      {/* The scale-on-hover lives on this inner motion.a, not the outer
         motion.li — the li's layout prop already owns its own transform for
         the entrance FLIP, so a transform (CSS or whileHover) placed there
         gets silently overridden. This element also receives real focus
         itself (rather than needing :focus-within on an ancestor), which is
         what whileFocus actually listens for. */}
      <motion.a
        href={video.permalinkUrl || undefined}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.thumbLink}
        aria-label="Facebook-Video ansehen"
        whileHover={{ scale: 1.03 }}
        whileFocus={{ scale: 1.03 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <div
          className={styles.thumb}
          style={video.thumbnail ? { backgroundImage: `url(${video.thumbnail})` } : undefined}
        >
          <span className={styles.playBadge}>
            <Play className={styles.playIcon} size={18} weight="fill" />
          </span>
        </div>
      </motion.a>
    </motion.li>
  );
}

// Same growing circle as the section's own background flood (SectionReveal),
// reused here via useSectionRevealCircle against this element's own box —
// a white duplicate of the heading is clip-path-masked to that exact circle
// and laid on top, so the eyebrow/title turn white only where the flood has
// already physically reached them, and stay their normal colors everywhere
// the flood hasn't (per pixel, mid-word if the wipe is mid-transition).
function FacebookHeading() {
  const wrapRef = useRef(null);
  const { revealed, instant, origin } = useSectionRevealCircle(SECTION_INDEX, wrapRef);
  const clipPath = `circle(${origin.r}px at ${origin.x}px ${origin.y}px)`;

  return (
    <div className={styles.headingWrap} ref={wrapRef}>
      <SectionHeading eyebrow="Facebook" title="Unser Social Media" align="center" />
      <div
        className={styles.headingClone}
        aria-hidden="true"
        data-revealed={revealed}
        data-instant={instant}
        style={{ clipPath, WebkitClipPath: clipPath }}
      >
        <SectionHeading eyebrow="Facebook" title="Unser Social Media" align="center" />
      </div>
    </div>
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

  return (
    <ul className={styles.grid}>
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} revealed={revealed} />
      ))}
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
        <FacebookHeading />
        <FacebookVideoRow revealed={revealed} isStacked={isStacked} />
      </div>
    </section>
  );
}
