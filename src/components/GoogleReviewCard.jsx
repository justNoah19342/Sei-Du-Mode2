import { useState } from "react";
import { motion } from "framer-motion";
import { Star } from "@phosphor-icons/react";
import styles from "./GoogleReviewCard.module.css";

const ENTRANCE_DURATION = 0.6;
// Mirrors --ease-reveal's curve — hardcoded because Framer Motion transition
// configs are plain JS values, not CSS custom properties.
const ENTRANCE_EASE = [0.25, 0.46, 0.45, 0.94];

// Every review is shown in full (no clamping/truncation, no "mehr" button
// into an overlay) — instead the text's own font-size scales down as it gets
// longer, so a long review still reads as "fits its card" rather than
// blowing the card's height out. Tiers, not a continuous formula: reviews
// are static hand-written copy (see data/reviews.js), so a few fixed steps
// are easier to reason about and tune by eye than a formula chasing every
// possible length.
const FONT_SIZE_TIERS = [
  { maxLength: 220, fontSize: "0.95rem" },
  { maxLength: 320, fontSize: "0.9rem" },
  { maxLength: 420, fontSize: "0.85rem" },
  { maxLength: Infinity, fontSize: "0.8125rem" },
];

function fontSizeForLength(length) {
  return FONT_SIZE_TIERS.find((tier) => length <= tier.maxLength).fontSize;
}

// Deterministic per-name color so the same reviewer always gets the same
// placeholder-avatar color across reloads, instead of a random one flashing
// differently each render.
const AVATAR_COLORS = ["#e8a33d", "#c98a2e", "#8a6d3b", "#b98b4e", "#d9a441"];

function colorForName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function Avatar({ name }) {
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

export default function GoogleReviewCard({ review, revealed = true }) {
  // Same "did the one-time scroll entrance already finish" guard as
  // VideoCard — a later layout change (e.g. resizing across a grid
  // breakpoint) should snap instantly instead of replaying the fan-out.
  const [hasSettled, setHasSettled] = useState(false);
  const isStacked = !revealed;

  return (
    <motion.li
      layout
      className={styles.card}
      style={isStacked ? { gridColumn: 1, gridRow: 1, pointerEvents: "none" } : undefined}
      transition={hasSettled ? { duration: 0 } : { duration: ENTRANCE_DURATION, ease: ENTRANCE_EASE }}
      onLayoutAnimationComplete={() => setHasSettled(true)}
    >
      <div className={styles.header}>
        <Avatar name={review.authorName} />
        <div className={styles.headerText}>
          <span className={styles.name}>{review.authorName}</span>
          <span className={styles.time}>{review.relativeTime}</span>
        </div>
      </div>
      <StarRow rating={review.rating} />
      <p className={styles.text} style={{ fontSize: fontSizeForLength(review.text.length) }}>
        {review.text}
      </p>
    </motion.li>
  );
}
