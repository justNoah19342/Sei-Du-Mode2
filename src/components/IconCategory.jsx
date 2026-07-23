import { Link } from "react-router-dom";
import { TShirt, Sneaker, Handbag, Sunglasses, Diamond } from "@phosphor-icons/react";
import styles from "./IconCategory.module.css";

const icons = { TShirt, Sneaker, Handbag, Sunglasses, Diamond };

export default function IconCategory({ categoryKey, icon, label }) {
  const IconComponent = icons[icon];
  return (
    <li>
      <Link to={`/sortiment/${categoryKey}`} className={styles.card}>
        <span className={styles.iconWrap}>
          {IconComponent && <IconComponent size={28} weight="light" />}
        </span>
        <span className={styles.label}>{label}</span>
      </Link>
    </li>
  );
}
