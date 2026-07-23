import { Link } from "react-router-dom";
import { business, address, contact } from "../data/content";
import styles from "./LegalPage.module.css";

export default function LegalPage({ title, children }) {
  return (
    <main className={styles.page}>
      <div className="container">
        <Link to="/" className={styles.back}>
          ← Zurück zur Startseite
        </Link>
        <h1>{title}</h1>
        {children}
        <address className={styles.imprint}>
          {business.legalName}
          <br />
          {address.full}
          <br />
          {contact.phone} · {contact.email}
        </address>
      </div>
    </main>
  );
}
