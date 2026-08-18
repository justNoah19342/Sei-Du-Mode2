import { Play } from "@phosphor-icons/react";
import SectionHeading from "../components/SectionHeading";
import SectionReveal from "../components/SectionReveal";
import { useFacebookVideos } from "../hooks/useFacebookVideos";
import { useReveal } from "../hooks/useReveal";
import { getSectionInfo } from "../lib/sectionRevealStore";
import styles from "./SocialMedia.module.css";

const { index: SECTION_INDEX, color: SECTION_COLOR } = getSectionInfo("social-media");
const SKELETON_COUNT = 5;

function VideoCard({ video, index }) {
  const ref = useReveal();

  return (
    <li ref={ref} className={`${styles.card} reveal`} style={{ "--index": index }}>
      <a
        href={video.permalinkUrl || undefined}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.thumbLink}
        aria-label="Facebook-Video ansehen"
      >
        <div
          className={styles.thumb}
          style={video.thumbnail ? { backgroundImage: `url(${video.thumbnail})` } : undefined}
        >
          <span className={styles.playBadge}>
            <Play className={styles.playIcon} size={18} weight="fill" />
          </span>
        </div>
      </a>
    </li>
  );
}

function FacebookVideoRow() {
  const { status, videos } = useFacebookVideos();

  // "not configured" / errored / empty all collapse to the same "nothing to
  // show yet" state rather than a broken-looking empty grid — the Meta app +
  // Page token setup is a separate step from shipping this component.
  if (status === "error" || (status === "loaded" && videos.length === 0)) {
    return null;
  }

  return (
    <ul className={styles.grid}>
      {status === "loading"
        ? Array.from({ length: SKELETON_COUNT }, (_, i) => (
            <li key={i} className={styles.card}>
              <div className={styles.thumb} />
            </li>
          ))
        : videos.map((video, i) => <VideoCard key={video.id} video={video} index={i} />)}
    </ul>
  );
}

export default function SocialMedia() {
  return (
    <section id="social-media" className={`${styles.section} section`}>
      <SectionReveal index={SECTION_INDEX} color={SECTION_COLOR} />
      <div className="container">
        <SectionHeading eyebrow="Social Media" title="Die letzten Videos" align="center" />
        <FacebookVideoRow />
      </div>
    </section>
  );
}
