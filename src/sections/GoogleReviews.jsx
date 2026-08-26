import { useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { ArrowSquareOut } from "@phosphor-icons/react";
import GoogleReviewCard from "../components/GoogleReviewCard";
import GoogleReviewOverlay from "../components/GoogleReviewOverlay";
import SectionHeading from "../components/SectionHeading";
import SectionReveal from "../components/SectionReveal";
import { googleReviewHref } from "../data/content";
import { useGoogleReviews } from "../hooks/useGoogleReviews";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { getSectionInfo } from "../lib/sectionRevealStore";
import styles from "./GoogleReviews.module.css";

const { index: SECTION_INDEX, color: SECTION_COLOR } = getSectionInfo("google-bewertungen");

// Below the same 899px breakpoint every other section switches to its
// stacked mobile layout at (Sortiment, Social Media), the 5-column grid
// collapses down to 1 column — all 5 full-height cards stacked vertically
// otherwise makes for a very long, card-after-card scroll. Showing only
// this many up front, behind a "mehr anzeigen" toggle, keeps that under
// control without hiding anything permanently.
const MOBILE_INITIAL_COUNT = 2;

export default function GoogleReviews() {
  const { reviews } = useGoogleReviews();
  const [activeReview, setActiveReview] = useState(null);
  const [showAllMobile, setShowAllMobile] = useState(false);
  const sectionRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();
  // Same "stack, then fan out into place" entrance as the Facebook video
  // cards (see VideoCard in FacebookVideoCard.jsx) — once:true + amount:0.15
  // matches that component's own trigger exactly, so both sections feel
  // identical when scrolled past.
  const isInView = useInView(sectionRef, { once: true, amount: 0.15 });
  const revealed = isInView || prefersReducedMotion;
  const isStacked = useMediaQuery("(max-width: 899px)");

  const canToggle = isStacked && reviews.length > MOBILE_INITIAL_COUNT;
  const visibleReviews = canToggle && !showAllMobile ? reviews.slice(0, MOBILE_INITIAL_COUNT) : reviews;

  return (
    <section id="google-bewertungen" ref={sectionRef} className={`${styles.section} section`}>
      <SectionReveal index={SECTION_INDEX} color={SECTION_COLOR} />
      <div className="container">
        <SectionHeading title="Was unsere Kundinnen sagen" align="center" />

        <ul className={styles.grid}>
          {visibleReviews.map((review) => (
            <GoogleReviewCard key={review.id} review={review} revealed={revealed} onOpen={setActiveReview} />
          ))}
        </ul>

        {canToggle && (
          <button type="button" className={styles.showMoreButton} onClick={() => setShowAllMobile((v) => !v)}>
            {showAllMobile ? "Weniger anzeigen" : "Mehr anzeigen"}
          </button>
        )}

        <a href={googleReviewHref} target="_blank" rel="noopener noreferrer" className={styles.cta}>
          Alle Bewertungen ansehen
          <ArrowSquareOut size={16} weight="bold" />
        </a>
      </div>

      {activeReview && <GoogleReviewOverlay review={activeReview} onClose={() => setActiveReview(null)} />}
    </section>
  );
}
