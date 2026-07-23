import styles from "./SectionHeading.module.css";

export default function SectionHeading({ eyebrow, title, align = "left" }) {
  return (
    <div className={`${styles.wrap} ${styles[align]}`}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2>{title}</h2>
    </div>
  );
}
