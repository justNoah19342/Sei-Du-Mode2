import { useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { ArrowSquareOut } from "@phosphor-icons/react";
import GoogleReviewCard from "../components/GoogleReviewCard";
import GoogleReviewOverlay from "../components/GoogleReviewOverlay";
import SectionHeading from "../components/SectionHeading";
import SectionReveal from "../components/SectionReveal";
import { googleReviewHref } from "../data/content";
import { useGoogleReviews } from "../hooks/useGoogleReviews";
import { getSectionInfo } from "../lib/sectionRevealStore";
import styles from "./GoogleReviews.module.css";

const { index: SECTION_INDEX, color: SECTION_COLOR } = getSectionInfo("google-bewertungen");

export default function GoogleReviews() {
  const { reviews } = useGoogleReviews();
  const [activeReview, setActiveReview] = useState(null);
  const sectionRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();
  // Same "stack, then fan out into place" entrance as the Facebook video
  // cards (see VideoCard in FacebookVideoCard.jsx) — once:true + amount:0.15
  // matches that component's own trigger exactly, so both sections feel
  // identical when scrolled past.
  const isInView = useInView(sectionRef, { once: true, amount: 0.15 });
  const revealed = isInView || prefersReducedMotion;

  return (
    <section id="google-bewertungen" ref={sectionRef} className={`${styles.section} section`}>
      <SectionReveal index={SECTION_INDEX} color={SECTION_COLOR} />
      <div className="container">
        <SectionHeading title="Was unsere Kundinnen sagen" align="center" />

        <ul className={styles.grid}>
          {reviews.map((review) => (
            <GoogleReviewCard key={review.id} review={review} revealed={revealed} onOpen={setActiveReview} />
          ))}
        </ul>

        <a href={googleReviewHref} target="_blank" rel="noopener noreferrer" className={styles.cta}>
          Alle Bewertungen ansehen
          <ArrowSquareOut size={16} weight="bold" />
        </a>
      </div>

      {activeReview && <GoogleReviewOverlay review={activeReview} onClose={() => setActiveReview(null)} />}
    </section>
  );
}
