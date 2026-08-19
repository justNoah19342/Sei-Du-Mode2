import { useRef, useState } from "react";
import { CaretLeft, CaretRight, Play } from "@phosphor-icons/react";
import styles from "./VideoCoverflow.module.css";

// Same depth/fade recipe as CategoryCoverflow (Sortiment section) — only the
// center slide is fully visible, up to 2 fade in on either side, a 3rd
// buffer step at opacity 0 so a slide can fade smoothly into/out of view
// instead of popping.
const STEPS = [
  { opacity: 1, scale: 1 },
  { opacity: 0.55, scale: 0.92 },
  { opacity: 0.22, scale: 0.86 },
  { opacity: 0, scale: 0.8 },
];

function buildSlots(n, offset) {
  if (n < 5) {
    const before = Math.floor((n - 1) / 2);
    const after = Math.ceil((n - 1) / 2);
    const slots = [];
    for (let delta = -before; delta <= after; delta += 1) {
      slots.push({ p: offset + delta, delta });
    }
    return slots;
  }

  const slots = [];
  for (let delta = -3; delta <= 3; delta += 1) {
    slots.push({ p: offset + delta, delta });
  }
  return slots;
}

export default function VideoCoverflow({ videos }) {
  const [offset, setOffset] = useState(0);
  const n = videos.length;

  const touchStartX = useRef(null);
  const touchTriggered = useRef(false);
  const SWIPE_THRESHOLD = 40;

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchTriggered.current = false;
  };

  const handleTouchMove = (e) => {
    if (touchStartX.current === null || touchTriggered.current || n <= 1) return;
    const delta = e.touches[0].clientX - touchStartX.current;
    if (Math.abs(delta) < SWIPE_THRESHOLD) return;
    touchTriggered.current = true;
    setOffset((o) => (delta < 0 ? o + 1 : o - 1));
  };

  const handleTouchEnd = () => {
    touchStartX.current = null;
  };

  if (n === 0) return null;

  const slots = buildSlots(n, offset);

  return (
    <div className={styles.row}>
      <div
        className={styles.viewport}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {n > 1 && (
          <button
            type="button"
            className={`${styles.navButton} ${styles.prev}`}
            onClick={() => setOffset((o) => o - 1)}
            aria-label="Vorheriges Video zeigen"
          >
            <CaretLeft size={18} weight="bold" />
          </button>
        )}

        {slots.map(({ p, delta }) => {
          const index = ((p % n) + n) % n;
          const video = videos[index];
          const step = STEPS[Math.min(Math.abs(delta), 3)];
          const isCenter = delta === 0;
          return (
            <div
              key={p}
              className={styles.slide}
              style={{
                opacity: step.opacity,
                transform: `translateX(calc(-50% + ${delta} * (var(--cf-width) + var(--cf-gap)))) scale(${step.scale})`,
                zIndex: 10 - Math.abs(delta),
                pointerEvents: isCenter ? "auto" : "none",
              }}
            >
              <a
                href={video.permalinkUrl || undefined}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.thumbLink}
                aria-label="Facebook-Video ansehen"
                tabIndex={isCenter ? undefined : -1}
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
            </div>
          );
        })}

        {n > 1 && (
          <button
            type="button"
            className={`${styles.navButton} ${styles.next}`}
            onClick={() => setOffset((o) => o + 1)}
            aria-label="Nächstes Video zeigen"
          >
            <CaretRight size={18} weight="bold" />
          </button>
        )}
      </div>
    </div>
  );
}
