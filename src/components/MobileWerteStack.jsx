import { useState } from "react";
import { motion } from "framer-motion";
import { Stack, ListBullets } from "@phosphor-icons/react";
import styles from "./MobileWerteStack.module.css";

const SWIPE_THRESHOLD = 50;

const layoutIcons = { stack: Stack, list: ListBullets };

// Mobile-only rearrangement of the same Werte-card visuals used on desktop
// (see UeberUns.module.css .werteCard), adapted from a swipeable card-stack
// pattern into this project's plain React + CSS Modules stack (no Tailwind/
// shadcn/TypeScript — those aren't part of this project, see project plan).
//
// Cards keep a stable order/key at all times — only each card's computed
// stackPosition changes when activeIndex changes. Earlier this reordered the
// underlying array itself (and wrapped it in AnimatePresence), which could
// leave a card "stuck" mid-drag when the reorder and the drag's own
// spring-back raced each other on a fast/far swipe.
export default function MobileWerteStack({ items }) {
  const [layout, setLayout] = useState("stack");
  const [activeIndex, setActiveIndex] = useState(0);

  const handleDragEnd = (_event, info) => {
    const { offset, velocity } = info;
    const swipe = Math.abs(offset.x) * velocity.x;

    if (offset.x < -SWIPE_THRESHOLD || swipe < -1000) {
      setActiveIndex((prev) => (prev + 1) % items.length);
    } else if (offset.x > SWIPE_THRESHOLD || swipe > 1000) {
      setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
    }
  };

  const getStackPosition = (index) => (index - activeIndex + items.length) % items.length;

  const getPositionStyles = (stackPosition) => {
    if (layout !== "stack") return { top: 0, left: 0, rotate: 0, zIndex: 1 };
    return {
      top: stackPosition * 8,
      left: stackPosition * 8,
      rotate: (stackPosition - 1) * 2,
      zIndex: items.length - stackPosition,
    };
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.toggleRow}>
        {Object.keys(layoutIcons).map((mode) => {
          const Icon = layoutIcons[mode];
          return (
            <button
              key={mode}
              className={`${styles.toggleBtn} ${layout === mode ? styles.toggleActive : ""}`}
              onClick={() => setLayout(mode)}
              aria-label={`Ansicht: ${mode}`}
              aria-pressed={layout === mode}
            >
              <Icon size={18} weight={layout === mode ? "fill" : "regular"} />
            </button>
          );
        })}
      </div>

      <div className={`${styles.container} ${styles[layout]}`}>
        {items.map((item, index) => {
          const stackPosition = getStackPosition(index);
          const isTop = layout === "stack" && stackPosition === 0;
          const pos = getPositionStyles(stackPosition);

          return (
            <motion.div
              key={item.title}
              layout
              animate={{ opacity: 1, scale: 1, x: 0, ...pos }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              drag={isTop ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.35}
              dragMomentum={false}
              onDragEnd={handleDragEnd}
              whileDrag={{ scale: 1.03 }}
              className={`${styles.card} ${layout === "stack" ? styles.stackCard : ""} ${
                isTop ? styles.grabbable : ""
              }`}
            >
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              {isTop && <span className={styles.swipeHint}>Zum Wischen ziehen</span>}
            </motion.div>
          );
        })}
      </div>

      {layout === "stack" && items.length > 1 && (
        <div className={styles.dashNav}>
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={styles.dashHit}
              aria-label={`Karte ${index + 1} anzeigen`}
            >
              <span className={`${styles.dash} ${index === activeIndex ? styles.dashActive : ""}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
