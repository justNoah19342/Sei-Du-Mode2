import { useLayoutEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { FacebookLogo, Heart, Play } from "@phosphor-icons/react";
import logo from "../assets/logo.jpeg";
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
// Descriptions longer than this collapse behind a "mehr" toggle, matching
// roughly the cutoff length shown in the reference design.
const DESCRIPTION_TRUNCATE_LENGTH = 140;
// How many rows (in card-heights) peek through above the section-wide "mehr"
// button before the rest of the grid is hidden behind the blur mask.
const COLLAPSED_ROW_COUNT = 1.5;

function formatRelativeTime(isoString) {
  if (!isoString) return "";
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return "gerade eben";
  if (diffMinutes < 60) return `vor ${diffMinutes} Minute${diffMinutes === 1 ? "" : "n"}`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `vor ${diffHours} Stunde${diffHours === 1 ? "" : "n"}`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `vor ${diffDays} Tag${diffDays === 1 ? "" : "en"}`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) return `vor ${diffWeeks} Woche${diffWeeks === 1 ? "" : "n"}`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `vor ${diffMonths} Monat${diffMonths === 1 ? "" : "en"}`;
  const diffYears = Math.floor(diffDays / 365);
  return `vor ${diffYears} Jahr${diffYears === 1 ? "" : "en"}`;
}

function VideoCard({ video, revealed }) {
  // Tracks whether the one-time scroll entrance has finished, so a later
  // layout change (e.g. resizing the window across a grid breakpoint) snaps
  // instantly instead of replaying the slide — layout stays "live" for the
  // component's whole lifetime otherwise.
  const [hasSettled, setHasSettled] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [liked, setLiked] = useState(false);
  const isStacked = !revealed;
  const description = video.description || "";
  const isLongDescription = description.length > DESCRIPTION_TRUNCATE_LENGTH;

  return (
    <motion.li
      layout
      className={styles.card}
      style={isStacked ? { gridColumn: 1, gridRow: 1, pointerEvents: "none" } : undefined}
      transition={hasSettled ? { duration: 0 } : { duration: ENTRANCE_DURATION, ease: ENTRANCE_EASE }}
      onLayoutAnimationComplete={() => setHasSettled(true)}
    >
      <div className={styles.cardHeader}>
        <img
          src={logo}
          alt="SEI DU Mode, Boutique in Neunkirchen-Seelscheid"
          className={styles.avatar}
        />
        <div className={styles.cardHeaderText}>
          <a
            href={video.permalinkUrl || undefined}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.pageName}
          >
            Sei Du Mode
          </a>
          <span className={styles.timestamp}>{formatRelativeTime(video.createdTime)}</span>
        </div>
        <FacebookLogo className={styles.platformIcon} weight="fill" size={20} aria-hidden="true" />
      </div>

      {description && (
        <p className={styles.description}>
          {isLongDescription && !descExpanded
            ? `${description.slice(0, DESCRIPTION_TRUNCATE_LENGTH).trimEnd()}…`
            : description}
          {isLongDescription && (
            <button
              type="button"
              className={styles.moreButton}
              onClick={() => setDescExpanded((value) => !value)}
            >
              {descExpanded ? " weniger" : " mehr"}
            </button>
          )}
        </p>
      )}

      {/* The scale-on-hover lives on this inner motion.button, not the outer
         motion.li — the li's layout prop already owns its own transform for
         the entrance FLIP, so a transform (CSS or whileHover) placed there
         gets silently overridden. This element also receives real focus
         itself (rather than needing :focus-within on an ancestor), which is
         what whileFocus actually listens for. */}
      <div className={styles.thumbWrap}>
        {playing && video.permalinkUrl ? (
          <iframe
            className={styles.videoFrame}
            src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
              video.permalinkUrl
            )}&show_text=false&autoplay=true`}
            title="Facebook-Video"
            allow="autoplay; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
            frameBorder="0"
          />
        ) : (
          <motion.button
            type="button"
            className={styles.thumbButton}
            aria-label="Facebook-Video abspielen"
            onClick={() => setPlaying(true)}
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
          </motion.button>
        )}
      </div>

      <div className={styles.cardFooter}>
        <button
          type="button"
          className={styles.likeButton}
          aria-pressed={liked}
          onClick={() => setLiked((value) => !value)}
        >
          <Heart weight={liked ? "fill" : "regular"} size={18} />
          Gefällt mir
        </button>
      </div>
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
  const { revealed, instant, origin } = useSectionRevealCircle(SECTION_INDEX, wrapRef, {
    collapseOnHide: true,
  });
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
  const [showAll, setShowAll] = useState(false);
  const gridRef = useRef(null);
  const [collapsedHeight, setCollapsedHeight] = useState(null);
  const [fullHeight, setFullHeight] = useState(null);
  const hasMore = videos.length > 5;

  // Measures the actual rendered row height (cards are 9:16 thumbnails, so
  // their height depends on the current column width) to derive a pixel
  // max-height showing ~1.5 rows before the fade/blur cutoff, and the grid's
  // true full height so expanding can transition to a real value instead of
  // jumping to "none".
  useLayoutEffect(() => {
    if (isStacked || !hasMore || !gridRef.current) return undefined;

    const measure = () => {
      const grid = gridRef.current;
      if (!grid) return;
      const firstCard = grid.querySelector(`.${styles.card}`);
      if (!firstCard) return;
      const rowHeight = firstCard.getBoundingClientRect().height;
      const gapPx = parseFloat(getComputedStyle(grid).rowGap) || 0;
      setCollapsedHeight(rowHeight * COLLAPSED_ROW_COUNT + gapPx * (COLLAPSED_ROW_COUNT - 1));
      setFullHeight(grid.scrollHeight);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(gridRef.current);
    return () => observer.disconnect();
  }, [hasMore, isStacked, videos.length]);

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

  const collapsedActive = hasMore && !showAll && collapsedHeight != null;

  return (
    <div className={styles.gridWrap}>
      <ul
        ref={gridRef}
        className={styles.grid}
        style={
          hasMore
            ? { maxHeight: showAll ? fullHeight ?? undefined : collapsedHeight ?? undefined, overflow: "hidden" }
            : undefined
        }
      >
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} revealed={revealed} />
        ))}
      </ul>
      {collapsedActive && <div className={styles.fadeMask} aria-hidden="true" />}
      {hasMore && (
        <button type="button" className={styles.showMoreButton} onClick={() => setShowAll((value) => !value)}>
          {showAll ? "weniger" : "mehr"}
        </button>
      )}
    </div>
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
