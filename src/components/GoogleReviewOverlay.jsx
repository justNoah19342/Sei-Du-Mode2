import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "@phosphor-icons/react";
import { useZoomCompensation } from "../hooks/useZoomCompensation";
import GoogleReviewCard from "./GoogleReviewCard";
import styles from "./GoogleReviewOverlay.module.css";

// Same overlay technique as CategoryCoverflow's enlarged product card and
// FacebookVideoCard's watch modal — blurred backdrop, click-outside/Escape
// to close, scroll-locked via the shared "product-overlay-open" body class
// — just without a video/description panel, since this is only ever the
// review card itself, shown larger and with its full (unclamped) text.
export default function GoogleReviewOverlay({ review, onClose }) {
  const zoomScale = useZoomCompensation();

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    document.body.classList.add("product-overlay-open");
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      document.body.classList.remove("product-overlay-open");
    };
  }, [onClose]);

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.zoomLock} style={{ transform: `scale(${zoomScale})` }}>
        <div className={styles.overlayCard} onClick={(e) => e.stopPropagation()}>
          <button type="button" className={styles.closeButton} aria-label="Schließen" onClick={onClose}>
            <X size={18} weight="bold" />
          </button>
          <ul className={styles.cardList}>
            <GoogleReviewCard review={review} expanded />
          </ul>
        </div>
      </div>
    </div>,
    document.body
  );
}
