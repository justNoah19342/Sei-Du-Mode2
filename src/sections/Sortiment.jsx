import { Fragment, useState } from "react";
import SectionHeading from "../components/SectionHeading";
import IconCategory from "../components/IconCategory";
import CategoryCoverflow from "../components/CategoryCoverflow";
import SectionReveal from "../components/SectionReveal";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { getSectionInfo } from "../lib/sectionRevealStore";
import { sortiment } from "../data/sortiment";
import styles from "./Sortiment.module.css";

const { index: SECTION_INDEX, color: SECTION_COLOR } = getSectionInfo("sortiment");

export default function Sortiment() {
  // Stacked (mobile/accordion) layout starts with every category collapsed —
  // null means "none open" there. Desktop always needs one selected (the
  // coverflow sits permanently below the row), so it falls back to the
  // first category via activeKeyForDesktop below.
  const [activeKey, setActiveKey] = useState(null);
  const [offset, setOffset] = useState(0);
  // Below this width the grid is a single column, so "under the box you
  // clicked" is a real, unambiguous position — the coverflow slots in right
  // there instead of below the whole list. On real desktop (5 side by
  // side), there's no single column to slot it under, so it stays below
  // the whole row like before.
  const isStacked = useMediaQuery("(max-width: 899px)");
  const activeKeyForDesktop = activeKey ?? sortiment[0].key;

  const selectCategory = (key) => {
    if (isStacked) {
      // Clicking the already-open category collapses it again; picking a
      // different one swaps which is open — never more than one at a time.
      setActiveKey((current) => (current === key ? null : key));
    } else {
      setActiveKey(key);
    }
    setOffset(0);
  };

  const coverflow = (
    <CategoryCoverflow
      key={activeKeyForDesktop}
      categoryKey={activeKeyForDesktop}
      offset={offset}
      onOffsetChange={setOffset}
    />
  );

  return (
    <section id="sortiment" className={`${styles.section} section`}>
      <SectionReveal index={SECTION_INDEX} color={SECTION_COLOR} />
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
            <Fragment key={item.key}>
              <IconCategory
                icon={item.icon}
                label={item.label}
                active={item.key === (isStacked ? activeKey : activeKeyForDesktop)}
                onSelect={() => selectCategory(item.key)}
              />
              {isStacked && item.key === activeKey && <li className={styles.inlineSlot}>{coverflow}</li>}
            </Fragment>
          ))}
        </ul>

        {!isStacked && coverflow}
      </div>
    </section>
  );
}
