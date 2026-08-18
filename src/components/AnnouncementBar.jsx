import { useEffect, useRef, useState } from "react";
import { X } from "@phosphor-icons/react";
import { useAnnouncementBar } from "../hooks/useAnnouncementBar";
import styles from "./AnnouncementBar.module.css";

const DISMISS_KEY = "sei-du-announcement-dismissed";
const REPEAT = 8;
const HEIGHT_VAR = "--announcement-height";

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
        <div className={styles.track}>
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
