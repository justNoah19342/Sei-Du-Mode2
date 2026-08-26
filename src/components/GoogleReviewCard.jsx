import { useState } from "react";
import { motion } from "framer-motion";
import { Star } from "@phosphor-icons/react";
import styles from "./GoogleReviewCard.module.css";

// Rough character estimate for whether the 4-line clamped text is likely to
// actually overflow those 4 lines — same idea as FacebookVideoCard's
// DESCRIPTION_TRUNCATE_LENGTH, just scaled up roughly 4x since this card
// clamps to 4 lines instead of 1.
const TEXT_TRUNCATE_LENGTH = 170;
const ENTRANCE_DURATION = 0.6;
// Mirrors --ease-reveal's curve — hardcoded because Framer Motion transition
// configs are plain JS values, not CSS custom properties.
const ENTRANCE_EASE = [0.25, 0.46, 0.45, 0.94];

// Deterministic per-name color so the same reviewer always gets the same
// placeholder-avatar color across reloads, instead of a random one flashing
// differently each render.
const AVATAR_COLORS = ["#e8a33d", "#c98a2e", "#8a6d3b", "#b98b4e", "#d9a441"];

function colorForName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function Avatar({ name, photo }) {
  if (photo) {
    return <img className={styles.avatar} src={photo} alt="" aria-hidden="true" loading="lazy" />;
  }
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className={styles.avatar} style={{ background: colorForName(name) }} aria-hidden="true">
      {initial}
    </div>
  );
}

function StarRow({ rating }) {
  return (
    <div className={styles.stars} aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={15} weight={i < rating ? "fill" : "regular"} className={i < rating ? styles.starFilled : styles.starEmpty} />
      ))}
    </div>
  );
}

// revealed/onOpen are only meaningful for the compact grid card — the
// enlarged overlay copy (see GoogleReviewOverlay.jsx) passes `expanded`
// instead, which always shows full text and skips the stack/fan-out
// entrance entirely (it's already the thing that just opened).
export default function GoogleReviewCard({ review, revealed = true, onOpen, expanded = false }) {
  // Same "did the one-time scroll entrance already finish" guard as
  // VideoCard — a later layout change (e.g. resizing across a grid
  // breakpoint) should snap instantly instead of replaying the fan-out.
  const [hasSettled, setHasSettled] = useState(false);
  const isStacked = !expanded && !revealed;
  const isLongText = !expanded && review.text.length > TEXT_TRUNCATE_LENGTH;

  return (
    <motion.li
      layout={!expanded}
      className={`${styles.card} ${expanded ? styles.cardExpanded : ""}`}
      style={isStacked ? { gridColumn: 1, gridRow: 1, pointerEvents: "none" } : undefined}
      transition={!expanded && !hasSettled ? { duration: ENTRANCE_DURATION, ease: ENTRANCE_EASE } : { duration: 0 }}
      onLayoutAnimationComplete={() => setHasSettled(true)}
    >
      <div className={styles.header}>
        <Avatar name={review.authorName} photo={review.authorPhoto} />
        <div className={styles.headerText}>
          <span className={styles.name}>{review.authorName}</span>
          <span className={styles.time}>{review.relativeTime}</span>
        </div>
      </div>
      <StarRow rating={review.rating} />
      <p className={expanded ? styles.textFull : styles.text}>{review.text}</p>
      {isLongText && (
        <button type="button" className={styles.moreButton} onClick={() => onOpen(review)}>
          mehr
        </button>
      )}
    </motion.li>
  );
}
