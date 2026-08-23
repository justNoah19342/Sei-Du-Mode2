import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { FacebookLogo, Heart, Play, ShareNetwork } from "@phosphor-icons/react";
import logo from "../assets/logo.jpeg";
import { useZoomCompensation } from "../hooks/useZoomCompensation";
import { loadFacebookSdk } from "../lib/facebookSdk";
import styles from "../sections/SocialMedia.module.css";

// Shared between the desktop grid (SocialMedia.jsx) and the mobile swipe
// carousel (VideoCoverflow.jsx) — both need the exact same card design and
// "watch" modal, just laid out differently around them.

// Descriptions longer than this collapse behind a "mehr" toggle — roughly
// the character count that fills the card's 5-line clamp at its typical
// width, so the toggle only appears when the clamp would actually kick in.
const DESCRIPTION_TRUNCATE_LENGTH = 220;
const ENTRANCE_DURATION = 0.6;
// Mirrors --ease-reveal's curve — hardcoded because Framer Motion transition
// configs are plain JS values, not CSS custom properties.
const ENTRANCE_EASE = [0.25, 0.46, 0.45, 0.94];

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

// "10789" -> "10k" — truncated (not rounded) to whole thousands, matching
// how large counts are conventionally abbreviated on social platforms.
function formatLikeCount(count) {
  if (count >= 1000) return `${Math.floor(count / 1000)}k`;
  return String(count);
}

function VideoActions({ liked, onToggleLike, likeCount, video }) {
  // The heart only ever toggles a local, visual "liked" state (see VideoCard/
  // VideoModal) — there's no real Facebook user session to like through, so
  // this is the honest optimistic-UI compromise: Facebook's own count, plus
  // one while the visitor's own heart is toggled on.
  const displayCount = likeCount + (liked ? 1 : 0);

  return (
    <div className={styles.actionsRow}>
      <button
        type="button"
        className={styles.likeButton}
        aria-pressed={liked}
        aria-label="Gefällt mir"
        onClick={onToggleLike}
      >
        <Heart weight={liked ? "fill" : "regular"} size={20} />
        {displayCount > 0 && <span className={styles.likeCount}>{formatLikeCount(displayCount)}</span>}
      </button>
      <button
        type="button"
        className={`${styles.iconButton} ${styles.shareButton}`}
        aria-label="Teilen"
        onClick={() => shareVideo(video)}
      >
        <ShareNetwork size={20} />
      </button>
    </div>
  );
}

export function VideoCard({ video, revealed, onOpen }) {
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

      <VideoActions liked={liked} onToggleLike={() => setLiked((value) => !value)} likeCount={video.likeCount ?? 0} video={video} />

      {/* Always rendered — even with a short or missing description — so
         every card reserves the same space a full 5-line-clamped one would
         need (see .description's min-height). Otherwise cards in the mobile
         coverflow, which has no grid/flex row to stretch them to a shared
         height, would each end up whatever size their own content happens
         to need. */}
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
    </motion.li>
  );
}

// Renders the video via Facebook's XFBML plugin (not a raw iframe) inside a
// fixed 9:16 box that never changes size or shape between videos. The plugin
// only ever takes a `width` and derives its own height from the video's real
// aspect ratio — it has no notion of "fit inside this height too" — so this
// picks whichever axis is the tighter constraint itself (matching CSS
// `object-fit: contain`) and passes THAT as data-width: a short/wide clip is
// constrained by the box's width (leaving black bars above/below), a
// tall/narrow one by the box's height (leaving black bars left/right). The
// fb-video div is built imperatively rather than left as JSX so it survives
// untouched across re-renders — React must never diff/replace it once
// Facebook's own script has taken it over. FB.XFBML.parse has to be called
// again after every mount/video change since these divs aren't part of the
// initial page HTML the SDK auto-discovers.
function FacebookVideoEmbed({ video }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!video.permalinkUrl || !container) return undefined;
    let cancelled = false;

    // Measures the box's actual rendered width AND height (rather than
    // deriving one from the other via a hardcoded ratio) so this keeps
    // working correctly regardless of exactly what shape SocialMedia.module
    // .css gives .overlayVideo at the current viewport — a true 9:16 frame
    // on desktop, or a shorter, width-capped one on mobile.
    const rect = container.getBoundingClientRect();
    const boxAspect = rect.width / rect.height;
    const nativeAspect = video.width && video.height ? video.width / video.height : boxAspect;
    const dataWidth = Math.round(
      nativeAspect >= boxAspect ? rect.width : rect.height * nativeAspect
    );

    const embed = document.createElement("div");
    embed.className = "fb-video";
    embed.dataset.href = video.permalinkUrl;
    embed.dataset.width = String(dataWidth);
    embed.dataset.showText = "false";
    embed.dataset.autoplay = "true";
    container.replaceChildren(embed);

    loadFacebookSdk().then((FB) => {
      if (cancelled || !containerRef.current) return;
      FB.XFBML.parse(containerRef.current);
    });

    return () => {
      cancelled = true;
    };
  }, [video.permalinkUrl, video.width, video.height]);

  return <div ref={containerRef} className={styles.overlayVideo} />;
}

// "Watch" view shared by desktop and mobile: the video plays large at the
// top/left in Facebook's own embed player, the post's full text sits in a
// scrollable panel next to/below it (SocialMedia.module.css switches that
// side-by-side layout to stacked under a mobile-width breakpoint). Same
// overlay technique as CategoryCoverflow's enlarged product card and
// AppointmentPicker's calendar box — blurred, click-outside-to-close,
// scroll-locked — reusing the shared "product-overlay-open" body class so it
// gets the same #root blur fallback and chrome-hiding rules for free.
export function VideoModal({ video, onClose }) {
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
          <FacebookVideoEmbed video={video} />
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
              <VideoActions liked={liked} onToggleLike={() => setLiked((value) => !value)} likeCount={video.likeCount ?? 0} video={video} />
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
