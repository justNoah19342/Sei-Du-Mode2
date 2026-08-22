import { memo, useEffect, useRef } from "react";
import SectionHeading from "../components/SectionHeading";
import SectionReveal from "../components/SectionReveal";
import { getSectionInfo } from "../lib/sectionRevealStore";
import { partners } from "../data/partners";
import styles from "./LogoCarousel.module.css";

const { index: SECTION_INDEX, color: SECTION_COLOR } = getSectionInfo("marken");

// ~50px/s, matching the old CSS animation's effective speed.
const SPEED_PX_PER_S = 50;

// How many full sets of partner cards sit in the DOM at once. This only has
// to be enough to comfortably cover the widest realistic viewport plus one
// spare set as a buffer — it no longer controls how far anything ever
// travels in one go (see the recycling loop below), so there's no downside
// to being generous here the way there was with the old approach.
const INITIAL_SETS = 5;

function PartnerCard({ partner, hidden }) {
  return (
    <a
      className={styles.card}
      href={partner.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
      onClick={(e) => e.currentTarget.blur()}
    >
      {/* Eager, not lazy — every logo in this strip is going to scroll into
         view within seconds regardless, and native lazy-loading was
         deferring the fetch until each card neared the viewport, which
         showed up as a stall in the marquee the first time a not-yet-cached
         logo scrolled in. */}
      <img className={styles.logo} src={partner.logo} alt={hidden ? "" : partner.name} />
    </a>
  );
}

// The marquee loop below reorders cards in the live DOM directly
// (appendChild), outside of React's own bookkeeping. This component takes
// no props, so memo() ensures it never re-renders after mount for reasons
// unrelated to it — e.g. the mobile menu's isDrawerOpen state in App.jsx —
// which would otherwise make React reconcile the DOM back to the static
// order this file's JSX always describes, undoing the recycling and
// visibly snapping the strip back into place.
function LogoCarousel() {
  const trackRef = useRef(null);

  // Opening a partner link (target="_blank") leaves that card focused; some
  // browsers re-apply focus to it when the tab regains visibility after the
  // new tab closes/loses focus, which would re-trigger the focus-within
  // pause below and leave its glow ring stuck. Clearing focus once the tab
  // is visible again covers that regardless of which browser did the
  // re-focusing.
  useEffect(() => {
    const clearStaleFocus = () => {
      if (document.visibilityState !== "visible") return;
      const track = trackRef.current;
      if (track && track.contains(document.activeElement)) {
        document.activeElement.blur();
      }
    };
    document.addEventListener("visibilitychange", clearStaleFocus);
    window.addEventListener("focus", clearStaleFocus);
    return () => {
      document.removeEventListener("visibilitychange", clearStaleFocus);
      window.removeEventListener("focus", clearStaleFocus);
    };
  }, []);

  // Drives the marquee by physically recycling cards instead of pre-baking a
  // long run of duplicated content: once the first card has fully scrolled
  // past the left edge, it gets moved (appendChild) to the end of the track
  // and the tracked offset is pulled back by exactly that card's width, in
  // the same frame — so the move is invisible. This is the same
  // append/loopFix technique Swiper.js uses internally for its own loop
  // mode, rather than translating a container across one giant fixed
  // distance. The practical win: the transform never travels further than a
  // single card's width (~190px) before resetting, instead of a whole set's
  // width (~1,800px+) — which is what was tripping Chromium's GPU
  // tile-recycling artifact (cards blanking out mid-scroll) on long,
  // uninterrupted translateX runs.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const gapPx = parseFloat(getComputedStyle(track).columnGap) || 0;

    let paused = false;
    const handleEnter = () => {
      paused = true;
    };
    const handleLeave = () => {
      paused = false;
    };
    if (canHover) {
      track.addEventListener("mouseenter", handleEnter);
      track.addEventListener("mouseleave", handleLeave);
      track.addEventListener("focusin", handleEnter);
      track.addEventListener("focusout", handleLeave);
    }

    let offset = 0;
    let lastTime = null;
    let frameId;
    const tick = (time) => {
      if (lastTime === null) lastTime = time;
      const deltaSeconds = (time - lastTime) / 1000;
      lastTime = time;

      if (!paused) {
        offset += SPEED_PX_PER_S * deltaSeconds;

        let first = track.firstElementChild;
        while (first) {
          const advance = first.getBoundingClientRect().width + gapPx;
          if (offset < advance) break;
          track.appendChild(first);
          offset -= advance;
          first = track.firstElementChild;
        }

        track.style.transform = `translate3d(${-offset}px, 0, 0)`;
      }
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      if (canHover) {
        track.removeEventListener("mouseenter", handleEnter);
        track.removeEventListener("mouseleave", handleLeave);
        track.removeEventListener("focusin", handleEnter);
        track.removeEventListener("focusout", handleLeave);
      }
    };
  }, []);

  return (
    <section id="marken" className={`${styles.section} section`}>
      <SectionReveal index={SECTION_INDEX} color={SECTION_COLOR} />
      <div className="container">
        <SectionHeading
          eyebrow="Marken"
          title="Marken, die wir führen"
          align="center"
        />
      </div>

      <div className={styles.viewport}>
        <div ref={trackRef} className={styles.track}>
          {Array.from({ length: INITIAL_SETS }, (_, copyIndex) =>
            partners.map((partner) => (
              <PartnerCard key={`${partner.name}-${copyIndex}`} partner={partner} hidden={copyIndex > 0} />
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export default memo(LogoCarousel);
