import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import ProductCard from "./ProductCard";
import { useCategoryProducts } from "../hooks/useCategoryProducts";
import styles from "./CategoryCoverflow.module.css";

// Fixed opacity/scale steps by distance from the centered slide — only the
// center is ever fully visible, up to 2 slides fade in on either side. A
// 3rd "buffer" step at opacity 0 lets a slide fade out/in smoothly right
// before it leaves/enters the visible 5, instead of popping.
const STEPS = [
  { opacity: 1, scale: 1 },
  { opacity: 0.55, scale: 0.92 },
  { opacity: 0.22, scale: 0.86 },
  { opacity: 0, scale: 0.8 },
];

function buildSlots(n, offset) {
  // Fewer than 5 products: show each exactly once, no wraparound padding —
  // duplicating a product to pad up to 5 would look like a bug, not a slide.
  if (n < 5) {
    const before = Math.floor((n - 1) / 2);
    const after = Math.ceil((n - 1) / 2);
    const slots = [];
    for (let delta = -before; delta <= after; delta += 1) {
      slots.push({ p: offset + delta, delta });
    }
    return slots;
  }

  // 5+ products: real infinite window. Render one slide of buffer on each
  // side (delta ±3) at opacity 0 so it can fade smoothly into/out of the
  // visible ±2 range as the window slides, instead of popping in.
  const slots = [];
  for (let delta = -3; delta <= 3; delta += 1) {
    slots.push({ p: offset + delta, delta });
  }
  return slots;
}

export default function CategoryCoverflow({ categoryKey, offset, onOffsetChange }) {
  const { status, products } = useCategoryProducts(categoryKey);
  const [isEnlarged, setIsEnlarged] = useState(false);

  const n = products.length;

  // Navigating away from the enlarged card should close it rather than
  // leave it open on whatever now happens to be centered.
  useEffect(() => {
    setIsEnlarged(false);
  }, [offset]);

  useEffect(() => {
    if (!isEnlarged) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setIsEnlarged(false);
    };
    window.addEventListener("keydown", onKeyDown);

    // Locks background scroll so the section behind the blurred overlay can
    // never scroll a fresh (unblurred) section into view underneath it, and
    // hides every other fixed/sticky chrome element (nav, call button, color
    // bubble) via the shared "product-overlay-open" body class — see each of
    // their own CSS modules for the corresponding :global() rule.
    document.body.style.overflow = "hidden";
    document.body.classList.add("product-overlay-open");

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      document.body.classList.remove("product-overlay-open");
    };
  }, [isEnlarged]);

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
    // Swipe left (finger moves left, delta negative) reveals what's to the
    // right — same as pressing "next".
    onOffsetChange((o) => (delta < 0 ? o + 1 : o - 1));
  };

  const handleTouchEnd = () => {
    touchStartX.current = null;
  };

  if (status !== "loaded" || n === 0) return null;

  const slots = buildSlots(n, offset);
  const centerIndex = ((offset % n) + n) % n;
  const centerProduct = products[centerIndex];

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
            onClick={() => onOffsetChange((o) => o - 1)}
            aria-label="Vorherige Produkte zeigen"
          >
            <CaretLeft size={20} weight="bold" />
          </button>
        )}

        {slots.map(({ p, delta }) => {
          const index = ((p % n) + n) % n;
          const product = products[index];
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
                cursor: isCenter ? "pointer" : undefined,
              }}
            >
              <ul className={styles.slideList}>
                <ProductCard
                  product={product}
                  expanded={isCenter}
                  onClick={isCenter ? () => setIsEnlarged(true) : undefined}
                />
              </ul>
            </div>
          );
        })}

        {n > 1 && (
          <button
            type="button"
            className={`${styles.navButton} ${styles.next}`}
            onClick={() => onOffsetChange((o) => o + 1)}
            aria-label="Nächste Produkte zeigen"
          >
            <CaretRight size={20} weight="bold" />
          </button>
        )}
      </div>

      {isEnlarged &&
        createPortal(
          <div className={styles.overlay} onClick={() => setIsEnlarged(false)}>
            <div className={styles.overlayCard} onClick={(e) => e.stopPropagation()}>
              <ul className={styles.slideList}>
                <ProductCard product={centerProduct} expanded large />
              </ul>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
