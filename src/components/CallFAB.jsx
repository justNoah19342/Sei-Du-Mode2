import { Phone } from "@phosphor-icons/react";
import { contact } from "../data/content";
import styles from "./CallFAB.module.css";

export default function CallFAB() {
  return (
    <a href={contact.phoneHref} className={styles.fab} aria-label="Jetzt anrufen">
      <Phone size={22} weight="fill" />
    </a>
  );
}
