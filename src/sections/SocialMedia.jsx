import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { FacebookLogo, Heart, Play, ShareNetwork } from "@phosphor-icons/react";
import logo from "../assets/logo.jpeg";
import SectionHeading from "../components/SectionHeading";
import SectionReveal from "../components/SectionReveal";
import VideoCoverflow from "../components/VideoCoverflow";
import { useFacebookVideos } from "../hooks/useFacebookVideos";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { useSectionRevealCircle } from "../hooks/useSectionRevealCircle";
import { useZoomCompensation } from "../hooks/useZoomCompensation";
import { loadFacebookSdk } from "../lib/facebookSdk";
import { getSectionInfo } from "../lib/sectionRevealStore";
import styles from "./SocialMedia.module.css";

const { index: SECTION_INDEX, color: SECTION_COLOR } = getSectionInfo("social-media");
const SKELETON_COUNT = 5;
const ENTRANCE_DURATION = 0.6;
// Mirrors --ease-reveal's curve — hardcoded because Framer Motion transition
// configs are plain JS values, not CSS custom properties.
const ENTRANCE_EASE = [0.25, 0.46, 0.45, 0.94];
// Descriptions longer than this collapse behind a "mehr" toggle — roughly
// the character count that fills the card's 5-line clamp at its typical
// width, so the toggle only appears when the clamp would actually kick in.
const DESCRIPTION_TRUNCATE_LENGTH = 220;
// Cards per row on desktop (matches .grid's 5-column layout) — also how many
// more videos each "mehr" click reveals, one full row at a time.
const GRID_COLUMNS = 5;
// Matches .overlayVideo's designed width (60% of .overlayCard's 1100px) —
// passed to the XFBML embed so Facebook renders the player at roughly its
// real on-screen size instead of some unrelated default.
const WATCH_VIDEO_WIDTH = 660;

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

// Facebook's own share dialog — no extra API scopes needed, unlike an actual
// re-post to the Page. Clearing the popup's `opener` (rather than passing
// "noopener" in the features string, which isn't part of the actual spec)
// is what stops the popup from reaching back into this window.
function shareVideo(video) {
  if (!video.permalinkUrl) return;
  const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(video.permalinkUrl)}`;
  const popup = window.open(shareUrl, "facebook-share", "width=580,height=470");
  if (popup) popup.opener = null;
}

function VideoActions({ liked, onToggleLike, video }) {
  return (
    <div className={styles.actionsRow}>
      <button
        type="button"
        className={styles.iconButton}
        aria-pressed={liked}
        aria-label="Gefällt mir"
        onClick={onToggleLike}
      >
        <Heart weight={liked ? "fill" : "regular"} size={20} />
      </button>
      <button
        type="button"
        className={styles.iconButton}
        aria-label="Teilen"
        onClick={() => shareVideo(video)}
      >
        <ShareNetwork size={20} />
      </button>
    </div>
  );
}

function VideoCard({ video, revealed, onOpen }) {
  // Tracks whether the one-time scroll entrance has finished, so a later
  // layout change (e.g. resizing the window across a grid breakpoint) snaps
  // instantly instead of replaying the slide — layout stays "live" for the
  // component's whole lifetime otherwise.
  const [hasSettled, setHasSettled] = useState(false);
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

      <div className={styles.thumbWrap}>
        <button
          type="button"
          className={styles.thumbButton}
          aria-label="Facebook-Video ansehen"
          onClick={() => onOpen(video)}
        >
          <div
            className={styles.thumb}
            style={video.thumbnail ? { backgroundImage: `url(${video.thumbnail})` } : undefined}
          >
            <span className={styles.playBadge}>
              <Play className={styles.playIcon} size={18} weight="fill" />
            </span>
          </div>
        </button>
      </div>

      <VideoActions liked={liked} onToggleLike={() => setLiked((value) => !value)} video={video} />

      {description && (
        <p className={`${styles.description} ${descExpanded ? "" : styles.descriptionClamped}`}>
          {description}
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
    </motion.li>
  );
}

// Renders the video via Facebook's XFBML plugin (not a raw iframe) so it
// auto-sizes to the video's real aspect ratio — a plain iframe just stretches
// to whatever CSS box it's given, leaving black bars wherever the box and
// the video's own shape don't match. FB.XFBML.parse has to be called after
// every mount/video change since these divs aren't in the page's initial
// HTML for the SDK to auto-discover.
function FacebookVideoEmbed({ permalinkUrl }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!permalinkUrl) return undefined;
    let cancelled = false;

    loadFacebookSdk().then((FB) => {
      if (cancelled || !containerRef.current) return;
      FB.XFBML.parse(containerRef.current);
    });

    return () => {
      cancelled = true;
    };
  }, [permalinkUrl]);

  return (
    <div ref={containerRef} className={styles.overlayVideo}>
      {permalinkUrl && (
        <div
          className="fb-video"
          data-href={permalinkUrl}
          data-width={WATCH_VIDEO_WIDTH}
          data-show-text="false"
          data-autoplay="true"
        />
      )}
    </div>
  );
}

// Desktop-only "watch" view: the video plays large on the left in Facebook's
// own embed player, the post's full text sits in a scrollable panel on the
// right. Same overlay technique as CategoryCoverflow's enlarged product card
// and AppointmentPicker's calendar box — blurred, click-outside-to-close,
// scroll-locked — reusing the shared "product-overlay-open" body class so it
// gets the same #root blur fallback and chrome-hiding rules for free.
function VideoModal({ video, onClose }) {
  const zoomScale = useZoomCompensation();
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    document.body.classList.add("product-overlay-open");
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      document.body.classList.remove("product-overlay-open");
    };
  }, [onClose]);

  const description = video.description || "";

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.zoomLock} style={{ transform: `scale(${zoomScale})` }}>
        <div className={styles.overlayCard} onClick={(e) => e.stopPropagation()}>
          <FacebookVideoEmbed permalinkUrl={video.permalinkUrl} />
          <div className={styles.overlaySide}>
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
            </div>
            {description && <p className={styles.overlayDescription}>{description}</p>}
            <div className={styles.overlayActions}>
              <VideoActions liked={liked} onToggleLike={() => setLiked((value) => !value)} video={video} />
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
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
  const [visibleCount, setVisibleCount] = useState(GRID_COLUMNS);
  const [activeVideo, setActiveVideo] = useState(null);
  const hasMore = visibleCount < videos.length;

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
  // grid. The stack→slide grid entrance below — and the desktop "watch"
  // modal — are desktop-only, so the carousel keeps its previous, simpler
  // tap-to-open-on-Facebook behavior instead.
  if (isStacked) {
    return <VideoCoverflow videos={videos} />;
  }

  const visibleVideos = videos.slice(0, visibleCount);
  // Once every fetched video is showing, the same button collapses the grid
  // straight back down to one row instead of just disappearing — clicking it
  // again pages back through one row at a time from there.
  const canToggle = hasMore || videos.length > GRID_COLUMNS;

  return (
    <div className={styles.gridWrap}>
      <ul className={styles.grid}>
        {visibleVideos.map((video) => (
          <VideoCard key={video.id} video={video} revealed={revealed} onOpen={setActiveVideo} />
        ))}
      </ul>
      {canToggle && (
        <button
          type="button"
          className={styles.showMoreButton}
          onClick={() =>
            setVisibleCount((count) => (hasMore ? count + GRID_COLUMNS : GRID_COLUMNS))
          }
        >
          {hasMore ? "mehr" : "weniger"}
        </button>
      )}
      {activeVideo && <VideoModal video={activeVideo} onClose={() => setActiveVideo(null)} />}
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
