import { Star } from "@phosphor-icons/react";
import styles from "./GoogleReviewCard.module.css";

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

export default function GoogleReviewCard({ review }) {
  return (
    <li className={styles.card}>
      <div className={styles.header}>
        <Avatar name={review.authorName} photo={review.authorPhoto} />
        <div className={styles.headerText}>
          <span className={styles.name}>{review.authorName}</span>
          <span className={styles.time}>{review.relativeTime}</span>
        </div>
      </div>
      <StarRow rating={review.rating} />
      <p className={styles.text}>{review.text}</p>
    </li>
  );
}
