import logo from "../assets/logo.jpeg";
import styles from "./Logo.module.css";

// onDark: the source photo has a white background, which blends into dark
// surfaces via mix-blend-mode on light backgrounds (Sidebar, mobile header)
// but would just look like a dark smudge on a dark footer. On dark
// backgrounds we instead give it its own small white card so the gold/grey
// artwork stays intact and fully legible.
export default function Logo({ size = "md", onDark = false }) {
  if (onDark) {
    return (
      <span className={`${styles.chip} ${styles[size]}`}>
        <img src={logo} alt="SEI DU Mode, Boutique in Neunkirchen-Seelscheid" className={styles.chipImg} />
      </span>
    );
  }

  return (
    <img
      src={logo}
      alt="SEI DU Mode, Boutique in Neunkirchen-Seelscheid"
      className={`${styles.logo} ${styles[size]}`}
    />
  );
}
