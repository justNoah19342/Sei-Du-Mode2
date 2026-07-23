import styles from "./BlobShape.module.css";

export default function BlobShape({ variant = "primary", className = "", style }) {
  return <div className={`${styles.blob} ${styles[variant]} ${className}`} style={style} aria-hidden="true" />;
}
