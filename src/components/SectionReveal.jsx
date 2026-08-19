import { useRef } from "react";
import { markSectionSettled, useSectionRevealCircle } from "../hooks/useSectionRevealCircle";
import styles from "./SectionReveal.module.css";

export default function SectionReveal({ index, color }) {
  const layerRef = useRef(null);
  const { revealed, instant, origin } = useSectionRevealCircle(index, layerRef);

  const handleTransitionEnd = (e) => {
    // Only the completion of a real *grow* (not a shrink, not some other
    // animated property) means "this section now fully has its color" —
    // that's the moment the bubble should disappear into it.
    if (e.propertyName === "transform" && e.currentTarget.getAttribute("data-revealed") === "true") {
      markSectionSettled(index);
    }
  };

  return (
    <div className={styles.layer} ref={layerRef} aria-hidden="true">
      <div
        className={styles.circle}
        data-revealed={revealed}
        data-instant={instant}
        onTransitionEnd={handleTransitionEnd}
        style={{
          left: `${origin.x - origin.r}px`,
          top: `${origin.y - origin.r}px`,
          width: `${origin.r * 2}px`,
          height: `${origin.r * 2}px`,
          background: color,
        }}
      />
    </div>
  );
}
