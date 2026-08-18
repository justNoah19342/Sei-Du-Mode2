import { PlayCircle } from "@phosphor-icons/react";
import SectionHeading from "../components/SectionHeading";
import SectionReveal from "../components/SectionReveal";
import { instagramVideos } from "../data/socialFeed";
import { useFacebookVideos } from "../hooks/useFacebookVideos";
import { getSectionInfo } from "../lib/sectionRevealStore";
import styles from "./SocialMedia.module.css";

const { index: SECTION_INDEX, color: SECTION_COLOR } = getSectionInfo("social-media");
const SKELETON_COUNT = 5;

function PlaceholderVideoRow({ heading, videos }) {
  return (
    <div className={styles.row}>
      <h3 className={styles.rowHeading}>{heading}</h3>
      <ul className={styles.grid}>
        {videos.map((video) => (
          <li key={video.id} className={styles.card}>
            <div className={styles.thumb} />
            <span className={styles.cardTitle}>{video.title}</span>
          </li>
        ))}
      </ul>
    </div>
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
    <div className={styles.row}>
      <h3 className={styles.rowHeading}>Facebook</h3>
      <ul className={styles.grid}>
        {status === "loading"
          ? Array.from({ length: SKELETON_COUNT }, (_, i) => (
              <li key={i} className={styles.card}>
                <div className={styles.thumb} />
              </li>
            ))
          : videos.map((video) => (
              <li key={video.id} className={styles.card}>
                <a
                  href={video.permalinkUrl || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.thumbLink}
                  aria-label={video.title}
                >
                  <div
                    className={styles.thumb}
                    style={video.thumbnail ? { backgroundImage: `url(${video.thumbnail})` } : undefined}
                  >
                    <PlayCircle className={styles.playIcon} size={40} weight="fill" />
                  </div>
                </a>
                <span className={styles.cardTitle}>{video.title}</span>
              </li>
            ))}
      </ul>
    </div>
  );
}

export default function SocialMedia() {
  return (
    <section id="social-media" className={`${styles.section} section`}>
      <SectionReveal index={SECTION_INDEX} color={SECTION_COLOR} />
      <div className="container">
        <SectionHeading
          eyebrow="Social Media"
          title="Die letzten Videos"
          align="center"
        />
        <FacebookVideoRow />
        <PlaceholderVideoRow heading="Instagram" videos={instagramVideos} />
      </div>
    </section>
  );
}
