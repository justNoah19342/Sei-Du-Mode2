import SectionHeading from "../components/SectionHeading";
import IconCategory from "../components/IconCategory";
import { sortiment } from "../data/sortiment";
import styles from "./Sortiment.module.css";

export default function Sortiment() {
  return (
    <section id="sortiment" className={`${styles.section} section`}>
      <div className="container">
        <SectionHeading
          eyebrow="Sortiment"
          title="Kuratiert statt Kette"
          align="center"
        />
        <p className={styles.intro}>
          Kleidung, Schuhe, Taschen und Accessoires abseits der üblichen
          Marken. Die Auswahl wechselt regelmäßig, ganz bewusst ohne Massenware.
        </p>

        <ul className={styles.grid}>
          {sortiment.map((item) => (
            <IconCategory key={item.key} categoryKey={item.key} icon={item.icon} label={item.label} />
          ))}
        </ul>
      </div>
    </section>
  );
}
