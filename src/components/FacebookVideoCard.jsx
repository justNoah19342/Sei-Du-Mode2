import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { FacebookLogo, Heart, Play, WhatsappLogo, X } from "@phosphor-icons/react";
import logo from "../assets/logo.jpeg";
import { useCookieConsent } from "../hooks/useCookieConsent";
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

// Opens straight into WhatsApp (the app on mobile if installed, WhatsApp Web
// on desktop) with the video link pre-filled, ready to pick a chat and send —
// this replaced Facebook's own sharer.php popup, which on mobile got
// intercepted by the Facebook app itself and dropped the visitor on its
// generic feed/post-composer instead of an actual share dialog. wa.me is
// WhatsApp's own official "click to chat" link format, so no API key or app
// approval is needed, same reasoning as the Facebook sharer it replaced.
function shareVideo(video) {
  if (!video.permalinkUrl) return;
  const text = `Schau dir dieses Video von Sei Du Mode an: ${video.permalinkUrl}`;
  const shareUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(shareUrl, "_blank", "noopener,noreferrer");
}

// "10789" -> "10k" — truncated (not rounded) to whole thousands, matching
// how large counts are conventionally abbreviated on social platforms.
function formatLikeCount(count) {
  if (count >= 1000) return `${Math.floor(count / 1000)}k`;
  return String(count);
}

// Shared sizing logic between the card's inline preview and the modal's
// full embed — both need to size a Facebook video.php iframe to fill a box
// of their own shape while respecting the video's real aspect ratio (see
// the long comment on FacebookVideoEmbed below for why offsetWidth/Height
// and the thumbnail-aspect fallback are used instead of the simpler
// alternatives).
function useEmbedSize(containerRef, video, active) {
  const [size, setSize] = useState(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!active || !video.permalinkUrl || !container) return undefined;
    let cancelled = false;

    const computeSize = (nativeAspect) => {
      if (cancelled || !containerRef.current) return;
      const boxWidth = containerRef.current.offsetWidth;
      const boxHeight = containerRef.current.offsetHeight;
      const boxAspect = boxWidth / boxHeight;
      const aspect = nativeAspect || boxAspect;
      const width = Math.round(aspect >= boxAspect ? boxWidth : boxHeight * aspect);
      const height = Math.round(width / aspect);
      setSize({ width, height });
    };

    const apiAspect = video.width && video.height ? video.width / video.height : null;

    if (apiAspect) {
      computeSize(apiAspect);
    } else if (video.thumbnail) {
      const img = new Image();
      img.onload = () => {
        computeSize(img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : null);
      };
      img.onerror = () => computeSize(null);
      img.src = video.thumbnail;
    } else {
      computeSize(null);
    }

    return () => {
      cancelled = true;
    };
  }, [containerRef, video.permalinkUrl, video.thumbnail, video.width, video.height, active]);

  return size;
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
        aria-label="Auf WhatsApp teilen"
        onClick={() => shareVideo(video)}
      >
        <WhatsappLogo size={20} weight="regular" />
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

  // EXPERIMENTAL, per explicit request to test the trade-off against the
  // click-to-load pattern discussed with the user: instead of only loading a
  // video once its own card is opened, every card on the page starts
  // playing its clip (muted, so autoplay is actually allowed by the browser)
  // as soon as general consent is given. This is the opposite of the
  // performance-friendly "facade" pattern normally recommended — it fires a
  // Facebook iframe request per visible card up front.
  const { consent } = useCookieConsent();
  const thumbRef = useRef(null);
  const previewActive = consent === "accepted";
  const previewSize = useEmbedSize(thumbRef, video, previewActive);

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
            ref={thumbRef}
            className={styles.thumb}
            style={video.thumbnail ? { backgroundImage: `url(${video.thumbnail})` } : undefined}
          >
            {previewActive && video.permalinkUrl && previewSize && (
              <iframe
                key={video.id}
                className={styles.thumbVideoFrame}
                src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
                  video.permalinkUrl
                )}&show_text=false&autoplay=true&mute=1&width=${previewSize.width}&height=${previewSize.height}`}
                width={previewSize.width}
                height={previewSize.height}
                title=""
                tabIndex={-1}
                aria-hidden="true"
                allow="autoplay"
                frameBorder="0"
              />
            )}
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

// Renders the video inside a fixed 9:16 box that never changes size or
// shape between videos, via a plain iframe onto Facebook's
// plugins/video.php — not the XFBML `<div class="fb-video">` +
// FB.XFBML.parse() approach this used previously, deliberately: XFBML
// embeds share state through the JS SDK's own internal registry, and
// re-parsing the *same* video's href into a fresh div (which is exactly
// what happens every time this modal is reopened, e.g. once on desktop and
// again after resizing to mobile in the same page session) turned out to be
// unreliable in practice — Facebook's player would sometimes render
// unrelated suggested content instead of the requested video, or an
// outright "Video Unavailable". A plain iframe is a fully independent
// browsing context per embed with no such shared registry, so the same
// video can be opened any number of times without one embed's state
// leaking into another's.
//
// video.php takes `width`/`height` as literal query params — the same ones
// Facebook's own "Get Code" tool emits for a fixed-size embed — so sizing
// works by measuring the box's actual rendered width AND height (not
// derived from a hardcoded ratio, so this keeps working whatever shape
// SocialMedia.module.css gives .overlayVideo at the current viewport), then
// picking whichever axis is the tighter constraint (matching CSS
// `object-fit: contain`) so a short/wide clip is constrained by the box's
// width (leaving black bars above/below) and a tall/narrow one by the box's
// height (bars left/right).
//
// The video's own aspect ratio for that math comes from video.width/height
// when the Graph API actually returned them — but it doesn't always
// (particularly for Reels), and guessing the box's own aspect as a stand-in
// then sends Facebook a width/height pair that doesn't match the real clip
// at all, which it responds to by zooming/cropping to fill rather than
// showing the full frame. The video's thumbnail is a far more reliable
// stand-in: it's a frame lifted directly from the video, so its own pixel
// dimensions are (in practice, always) the video's real aspect ratio too —
// falls back to the box's own aspect only if there's no thumbnail either.
function FacebookVideoEmbed({ video }) {
  const containerRef = useRef(null);
  const { consent, accept } = useCookieConsent();
  // Measuring/loading the iframe is pointless without consent — the hook
  // no-ops until accepted, then this component mounts a fresh
  // FacebookVideoEmbed-shaped render with the effect running for the first
  // time (see useEmbedSize above; offsetWidth/offsetHeight is used there
  // rather than getBoundingClientRect specifically because the modal's
  // entrance animation, .overlayCard's fbOverlayCardIn keyframes in
  // SocialMedia.module.css, scales the card up from 92% right as this
  // effect fires, and getBoundingClientRect would bake in whatever
  // mid-animation size happens to be current at that instant).
  const size = useEmbedSize(containerRef, video, consent === "accepted");

  return (
    <div ref={containerRef} className={styles.overlayVideo}>
      {consent === "accepted" && video.permalinkUrl && size && (
        <iframe
          key={video.id}
          className={styles.overlayVideoFrame}
          src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
            video.permalinkUrl
          )}&show_text=false&autoplay=true&mute=0&width=${size.width}&height=${size.height}`}
          width={size.width}
          height={size.height}
          title="Facebook-Video"
          allow="autoplay; encrypted-media; picture-in-picture; web-share"
          allowFullScreen
          frameBorder="0"
        />
      )}

      {consent !== "accepted" && (
        <div
          className={styles.consentGate}
          style={video.thumbnail ? { backgroundImage: `url(${video.thumbnail})` } : undefined}
        >
          <p className={styles.consentGateText}>
            Zum Abspielen wird eine Verbindung zu Facebook hergestellt und Cookies werden gesetzt.
          </p>
          <button type="button" className={styles.consentGateButton} onClick={accept}>
            <Play size={16} weight="fill" />
            Video laden
          </button>
        </div>
      )}
    </div>
  );
}

// "Watch" view shared by desktop and mobile: the video plays large at the
// top/left in Facebook's own embed player, the post's full text sits in a
// scrollable panel next to/below it (SocialMedia.module.css switches that
// side-by-side layout to stacked under a mobile-width breakpoint). Same
// overlay technique as CategoryCoverflow's enlarged product card — blurred,
// click-outside-to-close, scroll-locked — reusing the shared
// "product-overlay-open" body class so it
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
          <button type="button" className={styles.overlayCloseButton} aria-label="Schließen" onClick={onClose}>
            <X size={18} weight="bold" />
          </button>
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
