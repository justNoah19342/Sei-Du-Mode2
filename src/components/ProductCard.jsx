import { urlForImage } from "../lib/sanityClient";
import styles from "./ProductCard.module.css";

export default function ProductCard({ product }) {
  const imageUrl = product.image ? urlForImage(product.image)?.width(480).height(360).fit("crop").url() : null;

  return (
    <li className={styles.card}>
      <div className={styles.imageWrap}>
        {imageUrl ? (
          <img src={imageUrl} alt={product.name} loading="lazy" />
        ) : (
          <div className={styles.imagePlaceholder} aria-hidden="true" />
        )}
      </div>
      <div className={styles.body}>
        <h3 className={styles.name}>{product.name}</h3>
        <span className={styles.accent} aria-hidden="true" />
        {product.beschreibung && <p className={styles.description}>{product.beschreibung}</p>}
      </div>
    </li>
  );
}
