import styles from "./NavLink.module.css";

export default function NavLink({ label, isActive, onClick }) {
  return (
    <li>
      <button
        className={`${styles.link} ${isActive ? styles.active : ""}`}
        onClick={onClick}
        aria-current={isActive ? "true" : undefined}
      >
        <span className={styles.dash} aria-hidden="true" />
        {label}
      </button>
    </li>
  );
}
