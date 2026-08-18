import { TShirt, Sneaker, Handbag, Sunglasses, Sparkle } from "@phosphor-icons/react";
import styles from "./IconCategory.module.css";

const icons = { TShirt, Sneaker, Handbag, Sunglasses, Sparkle };

export default function IconCategory({ icon, label, active, onSelect }) {
  const IconComponent = icons[icon];
  return (
    <li>
      <button
        type="button"
        className={`${styles.card} ${active ? styles.active : ""}`}
        onClick={onSelect}
        aria-pressed={active}
      >
        <span className={styles.iconWrap}>
          {IconComponent && <IconComponent size={28} weight="light" />}
        </span>
        <span className={styles.label}>{label}</span>
      </button>
    </li>
  );
}
