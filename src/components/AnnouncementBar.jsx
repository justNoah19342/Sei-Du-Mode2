import { useEffect, useRef, useState } from "react";
import { X } from "@phosphor-icons/react";
import { useAnnouncementBar } from "../hooks/useAnnouncementBar";
import styles from "./AnnouncementBar.module.css";

const DISMISS_KEY = "sei-du-announcement-dismissed";
const REPEAT = 8;
const HEIGHT_VAR = "--announcement-height";
// Matches the brand-logo marquee's speed just below the hero (LogoCarousel:
// ~42px/s). The announcement text comes from the CMS and its rendered width
// varies, so — unlike LogoCarousel's fixed copy count — the duration has to
// be derived from the actual measured track width rather than a constant.
const TRACK_SPEED_PX_S = 42;
const DEFAULT_DURATION_S = 28;

export default function AnnouncementBar() {
  const { status, data } = useAnnouncementBar();
  const [dismissedText, setDismissedText] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY);
    } catch {
      return null;
    }
  });
  const barRef = useRef(null);
  const trackRef = useRef(null);
  const [duration, setDuration] = useState(DEFAULT_DURATION_S);

  const visible = status === "loaded" && data?.aktiv && data?.text && data.text !== dismissedText;

  // Sidebar/MobileHeader read this to stick right below the bar instead of
  // at the very top — so the two stack without ever overlapping, and
  // collapses back to 0 the instant the bar isn't shown (no data, or
  // dismissed) instead of leaving a gap above the nav.
  useEffect(() => {
    if (!visible) {
      document.documentElement.style.setProperty(HEIGHT_VAR, "0px");
      return;
    }

    const el = barRef.current;
    if (!el) return;

    const update = () => {
      document.documentElement.style.setProperty(HEIGHT_VAR, `${el.getBoundingClientRect().height}px`);
    };
    update();

    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(el);
    return () => resizeObserver.disconnect();
  }, [visible]);

  // Track width depends on the CMS text length, so the duration needed to
  // hold TRACK_SPEED_PX_S has to be derived from the actual rendered width.
  useEffect(() => {
    if (!visible) return;
    const track = trackRef.current;
    if (!track) return;

    const update = () => {
      const halfWidth = track.scrollWidth / 2;
      if (halfWidth > 0) setDuration(halfWidth / TRACK_SPEED_PX_S);
    };
    update();

    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(track);
    return () => resizeObserver.disconnect();
  }, [visible, data?.text]);

  if (!visible) return null;

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, data.text);
    } catch {
      // Private browsing etc. — dismissal just won't persist across reloads.
    }
    setDismissedText(data.text);
  };

  const items = Array.from({ length: REPEAT }, (_, i) => i);

  return (
    <div className={styles.bar} ref={barRef}>
      <div className={styles.viewport}>
        <div className={styles.track} ref={trackRef} style={{ animationDuration: `${duration}s` }}>
          {items.map((i) => (
            <span className={styles.item} key={`a-${i}`}>
              {data.text}
            </span>
          ))}
          {items.map((i) => (
            <span className={styles.item} key={`b-${i}`} aria-hidden="true">
              {data.text}
            </span>
          ))}
        </div>
      </div>

      <button type="button" className={styles.close} onClick={handleDismiss} aria-label="Ankündigung schließen">
        <X size={16} weight="bold" />
      </button>
    </div>
  );
}
