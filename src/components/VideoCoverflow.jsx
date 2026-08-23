import { useLayoutEffect, useRef, useState } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { VideoCard } from "./FacebookVideoCard";
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

export default function VideoCoverflow({ videos, onOpen }) {
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

  // The full VideoCard (header + thumb + actions + description) is a much
  // taller, content-dependent shape than the old thumbnail-only slide, so
  // the viewport can no longer just be a fixed 9:16 box — it measures the
  // centered card's real rendered height instead and sizes itself to that,
  // re-measuring whenever that card's own content (e.g. an expanded
  // description) or width changes.
  const centerCardRef = useRef(null);
  const [viewportHeight, setViewportHeight] = useState(null);

  useLayoutEffect(() => {
    const card = centerCardRef.current;
    if (!card) return undefined;

    const measure = () => setViewportHeight(card.getBoundingClientRect().height);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(card);
    return () => observer.disconnect();
  }, [offset]);

  if (n === 0) return null;

  const slots = buildSlots(n, offset);

  return (
    <div className={styles.row}>
      <div
        className={styles.viewport}
        style={viewportHeight ? { height: viewportHeight } : undefined}
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
              <ul className={styles.slideList} ref={isCenter ? centerCardRef : undefined}>
                {/* revealed: true — the stack-then-slide scroll entrance is a
                   desktop-grid-only effect; the carousel already has its own
                   swipe-driven presentation and doesn't need cards starting
                   pointer-events:none while off in a corner. */}
                <VideoCard video={video} revealed onOpen={isCenter ? onOpen : () => {}} />
              </ul>
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
