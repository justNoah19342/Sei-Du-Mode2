import { useParams, Link, Navigate } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { sortiment } from "../data/sortiment";
import { useCategoryProducts } from "../hooks/useCategoryProducts";
import styles from "./SortimentKategorie.module.css";

export default function SortimentKategorie() {
  const { kategorie } = useParams();
  const category = sortiment.find((item) => item.key === kategorie);
  const { status, products } = useCategoryProducts(kategorie);

  if (!category) {
    return <Navigate to="/#sortiment" replace />;
  }

  return (
    <main className={styles.page}>
      <div className="container">
        <Link to="/#sortiment" className={styles.back}>
          ← Zurück zum Sortiment
        </Link>
        <span className="eyebrow">Sortiment</span>
        <h1>{category.label}</h1>

        {status === "loading" && <p className={styles.notice}>Produkte werden geladen …</p>}

        {status === "not-configured" && (
          <p className={styles.notice}>
            Für diese Seite ist noch kein Sanity-Projekt verbunden. Sobald das CMS eingerichtet ist,
            erscheinen hier die hochgeladenen Produkte dieser Kategorie.
          </p>
        )}

        {status === "error" && (
          <p className={styles.notice}>
            Die Produkte konnten gerade nicht geladen werden. Bitte später erneut versuchen.
          </p>
        )}

        {status === "loaded" && products.length === 0 && (
          <p className={styles.notice}>Für "{category.label}" sind aktuell noch keine Produkte hinterlegt.</p>
        )}

        {status === "loaded" && products.length > 0 && (
          <ul className={styles.grid}>
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
