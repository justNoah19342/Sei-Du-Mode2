import { useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Play } from "@phosphor-icons/react";
import SectionHeading from "../components/SectionHeading";
import SectionReveal from "../components/SectionReveal";
import { useFacebookVideos } from "../hooks/useFacebookVideos";
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

function FacebookVideoRow({ revealed }) {
  const { status, videos } = useFacebookVideos();

  // "not configured" / errored / empty all collapse to the same "nothing to
  // show yet" state rather than a broken-looking empty grid — the Meta app +
  // Page token setup is a separate step from shipping this component.
  if (status === "error" || (status === "loaded" && videos.length === 0)) {
    return null;
  }

  return (
    <ul className={styles.grid}>
      {status === "loading"
        ? Array.from({ length: SKELETON_COUNT }, (_, i) => (
            <li key={i} className={styles.card}>
              <div className={styles.thumb} />
            </li>
          ))
        : videos.map((video) => <VideoCard key={video.id} video={video} revealed={revealed} />)}
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

  return (
    <section id="social-media" ref={sectionRef} className={`${styles.section} section`}>
      <SectionReveal index={SECTION_INDEX} color={SECTION_COLOR} />
      <div className="container">
        <SectionHeading eyebrow="Facebook" title="Unser Social Media" align="center" />
        <FacebookVideoRow revealed={revealed} />
      </div>
    </section>
  );
}
