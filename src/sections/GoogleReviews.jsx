import { ArrowSquareOut } from "@phosphor-icons/react";
import GoogleReviewCard from "../components/GoogleReviewCard";
import SectionHeading from "../components/SectionHeading";
import SectionReveal from "../components/SectionReveal";
import { googleReviewHref } from "../data/content";
import { useGoogleReviews } from "../hooks/useGoogleReviews";
import { getSectionInfo } from "../lib/sectionRevealStore";
import styles from "./GoogleReviews.module.css";

const { index: SECTION_INDEX, color: SECTION_COLOR } = getSectionInfo("google-bewertungen");

export default function GoogleReviews() {
  const { reviews } = useGoogleReviews();

  return (
    <section id="google-bewertungen" className={`${styles.section} section`}>
      <SectionReveal index={SECTION_INDEX} color={SECTION_COLOR} />
      <div className="container">
        <SectionHeading eyebrow="Google" title="Was unsere Kundinnen sagen" align="center" />

        <ul className={styles.grid}>
          {reviews.map((review) => (
            <GoogleReviewCard key={review.id} review={review} />
          ))}
        </ul>

        <a href={googleReviewHref} target="_blank" rel="noopener noreferrer" className={styles.cta}>
          Alle Bewertungen ansehen
          <ArrowSquareOut size={16} weight="bold" />
        </a>
      </div>
    </section>
  );
}
