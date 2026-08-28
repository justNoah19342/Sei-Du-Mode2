import { useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { VideoCard, VideoModal } from "../components/FacebookVideoCard";
import SectionHeading from "../components/SectionHeading";
import SectionReveal from "../components/SectionReveal";
import VideoCoverflow from "../components/VideoCoverflow";
import { useFacebookVideos } from "../hooks/useFacebookVideos";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { getSectionInfo } from "../lib/sectionRevealStore";
import styles from "./SocialMedia.module.css";

const { index: SECTION_INDEX, color: SECTION_COLOR } = getSectionInfo("social-media");
const SKELETON_COUNT = 5;
// Cards per row on desktop (matches .grid's 5-column layout) — also how many
// more videos each "mehr" click reveals, one full row at a time.
const GRID_COLUMNS = 5;
// Upper bound on how many of the fetched videos this section ever shows,
// on both the desktop grid (even after repeatedly clicking "mehr") and the
// mobile swipe carousel.
const MAX_VIDEOS = 10;

function FacebookVideoRow({ revealed, isStacked }) {
  const { status, videos: fetchedVideos } = useFacebookVideos();
  const videos = fetchedVideos.slice(0, MAX_VIDEOS);
  const [visibleCount, setVisibleCount] = useState(GRID_COLUMNS);
  const [activeVideo, setActiveVideo] = useState(null);
  const hasMore = visibleCount < videos.length;

  // "not configured" / errored / empty all collapse to the same "nothing to
  // show yet" state rather than a broken-looking empty grid — the Meta app +
  // Page token setup is a separate step from shipping this component.
  if (status === "error" || (status === "loaded" && videos.length === 0)) {
    return null;
  }

  if (status === "loading") {
    // Same skeleton grid regardless of breakpoint — a brief, content-agnostic
    // placeholder doesn't need the swipe carousel's interactivity.
    return (
      <ul className={styles.grid}>
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <li key={i} className={styles.card}>
            <div className={styles.thumb} />
          </li>
        ))}
      </ul>
    );
  }

  // ≤899px: horizontal swipe carousel (same touch+arrow mechanism as the
  // Sortiment section's CategoryCoverflow), rendering the same VideoCard
  // design as the desktop grid — just one at a time, swiped through, instead
  // of five side by side. The watch modal below is shared by both.
  if (isStacked) {
    return (
      <>
        <VideoCoverflow videos={videos} onOpen={setActiveVideo} />
        {activeVideo && <VideoModal video={activeVideo} onClose={() => setActiveVideo(null)} />}
      </>
    );
  }

  const visibleVideos = videos.slice(0, visibleCount);
  // Once every fetched video is showing, the same button collapses the grid
  // straight back down to one row instead of just disappearing — clicking it
  // again pages back through one row at a time from there.
  const canToggle = hasMore || videos.length > GRID_COLUMNS;

  return (
    <div className={styles.gridWrap}>
      <ul className={styles.grid}>
        {visibleVideos.map((video) => (
          <VideoCard key={video.id} video={video} revealed={revealed} onOpen={setActiveVideo} />
        ))}
      </ul>
      {canToggle && (
        <button
          type="button"
          className={styles.showMoreButton}
          onClick={() =>
            setVisibleCount((count) => (hasMore ? count + GRID_COLUMNS : GRID_COLUMNS))
          }
        >
          {hasMore ? "mehr" : "weniger"}
        </button>
      )}
      {activeVideo && <VideoModal video={activeVideo} onClose={() => setActiveVideo(null)} />}
    </div>
  );
}

export default function SocialMedia() {
  const sectionRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();
  // once:true — cards should only ever stack-then-slide the first time the
  // section is scrolled into view. amount matches useReveal.js's own
  // IntersectionObserver threshold (0.15) used elsewhere on the site.
  const isInView = useInView(sectionRef, { once: true, amount: 0.15 });
  // Sits on the <section> itself (not on the cards or their row) so it's a
  // pure function of scroll position, independent of whether the videos
  // have finished loading yet — a slow network resolving videos after the
  // section already scrolled past should render them straight into their
  // final position, not stack-then-slide late.
  const revealed = isInView || prefersReducedMotion;
  // Matches CategoryCoverflow's own stacked/desktop split in Sortiment.jsx —
  // below this width the swipe carousel takes over from the grid.
  const isStacked = useMediaQuery("(max-width: 899px)");

  return (
    <section id="social-media" ref={sectionRef} className={`${styles.section} section`}>
      <SectionReveal index={SECTION_INDEX} color={SECTION_COLOR} />
      <div className="container">
        <SectionHeading eyebrow="Facebook" title="Unser Social Media" align="center" />
        <FacebookVideoRow revealed={revealed} isStacked={isStacked} />
      </div>
    </section>
  );
}
