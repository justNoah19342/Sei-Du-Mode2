import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { FacebookLogo, Heart, Play, ShareNetwork } from "@phosphor-icons/react";
import logo from "../assets/logo.jpeg";
import { useZoomCompensation } from "../hooks/useZoomCompensation";
import styles from "../sections/SocialMedia.module.css";

// Shared between the desktop grid (SocialMedia.jsx) and the mobile swipe
// carousel (VideoCoverflow.jsx) — both need the exact same card design and
// "watch" modal, just laid out differently around them.

// Descriptions longer than this get a "mehr" button — a rough character
// estimate for whether the 1-line description is likely to overflow and
// need the ellipsis at all (the ellipsis itself is exact, handled by CSS
// text-overflow, not this — this constant only decides whether to bother
// showing the button in the first place).
const DESCRIPTION_TRUNCATE_LENGTH = 40;
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
         every card reserves the same space a full 1-line one would need
         (see .descriptionRow's min-height). Otherwise cards in the mobile
         coverflow, which has no grid/flex row to stretch them to a shared
         height, would each end up whatever size their own content happens
         to need.

         .description and .moreButton are separate flex children rather than
         one run of inline content: .description's own text-overflow:
         ellipsis handles the 1-line truncation exactly (no character-count
         guessing), and because "mehr" sits outside that clipped box instead
         of being the tail end of it, it can never itself get wrapped to a
         second line or clipped away along with the overflow — it's always
         the one thing guaranteed to stay on line one. Clicking it opens the
         same watch modal the thumbnail does, same as if "mehr" is just
         another way to reach the full video + full description. */}
      <div className={styles.descriptionRow}>
        <p className={styles.description}>{description}</p>
        {isLongDescription && (
          <button type="button" className={styles.moreButton} onClick={() => onOpen(video)}>
            mehr
          </button>
        )}
      </div>
    </motion.li>
  );
}

// Renders the video via Facebook's XFBML plugin (not a raw iframe) inside a
// fixed 9:16 box that never changes size or shape between videos. A plain
// iframe onto Facebook's plugins/video.php — not the XFBML `<div
// class="fb-video">` + FB.XFBML.parse() approach this used previously —
// deliberately: XFBML embeds share state through the JS SDK's own internal
// registry, and re-parsing the *same* video's href into a fresh div (which
// is exactly what happens every time this modal is reopened, e.g. once on
// desktop and again after resizing to mobile in the same page session)
// turned out to be unreliable in practice — Facebook's player would
// sometimes render unrelated suggested content instead of the requested
// video, or an outright "Video Unavailable". A plain iframe is a fully
// independent browsing context per embed with no such shared registry, so
// the same video can be opened any number of times without one embed's
// state leaking into another's.
//
// video.php takes `width`/`height` as literal query params — the same ones
// Facebook's own "Get Code" tool emits for a fixed-size embed — so sizing
// still works exactly like before: measures the box's actual rendered width
// AND height (not derived from a hardcoded ratio) so this keeps working
// whatever shape SocialMedia.module.css gives .overlayVideo at the current
// viewport, then picks whichever axis is the tighter constraint (matching
// CSS `object-fit: contain`) so a short/wide clip is constrained by the
// box's width (leaving black bars above/below) and a tall/narrow one by the
// box's height (bars left/right).
function FacebookVideoEmbed({ video }) {
  const containerRef = useRef(null);
  const [size, setSize] = useState(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!video.permalinkUrl || !container || video.isReel) return;

    const rect = container.getBoundingClientRect();
    const boxAspect = rect.width / rect.height;
    const nativeAspect = video.width && video.height ? video.width / video.height : boxAspect;
    const width = Math.round(nativeAspect >= boxAspect ? rect.width : rect.height * nativeAspect);
    const height = Math.round(width / nativeAspect);
    setSize({ width, height });
  }, [video.permalinkUrl, video.width, video.height, video.isReel]);

  // Reels (/reel/ permalinks) aren't a documented supported href for
  // plugins/video.php — Meta's own embed docs only cover classic /videos/
  // links, and in practice embedding a Reel is unreliable (sometimes
  // "Video Unavailable", sometimes unrelated content, differing by exactly
  // what pixel size happens to get requested). Rather than gamble on an
  // embed that has no official support, Reels get their thumbnail plus a
  // direct link out to Facebook instead.
  if (video.isReel) {
    return (
      <div
        className={styles.overlayVideo}
        style={video.thumbnail ? { backgroundImage: `url(${video.thumbnail})` } : undefined}
      >
        <a
          href={video.permalinkUrl || undefined}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.overlayReelLink}
        >
          Auf Facebook ansehen
        </a>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={styles.overlayVideo}>
      {video.permalinkUrl && size && (
        <iframe
          key={video.id}
          className={styles.overlayVideoFrame}
          src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
            video.permalinkUrl
          )}&show_text=false&autoplay=true&width=${size.width}&height=${size.height}`}
          width={size.width}
          height={size.height}
          title="Facebook-Video"
          allow="autoplay; encrypted-media; picture-in-picture; web-share"
          allowFullScreen
          frameBorder="0"
        />
      )}
    </div>
  );
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
