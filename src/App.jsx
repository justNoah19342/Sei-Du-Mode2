import { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import MobileHeader from "./components/MobileHeader";
import MobileDrawer from "./components/MobileDrawer";
import CallFAB from "./components/CallFAB";
import Hero from "./sections/Hero";
import UeberUns from "./sections/UeberUns";
import Sortiment from "./sections/Sortiment";
import OeffnungszeitenKontakt from "./sections/OeffnungszeitenKontakt";
import Footer from "./sections/Footer";
import Impressum from "./pages/Impressum";
import Datenschutz from "./pages/Datenschutz";
import SortimentKategorie from "./pages/SortimentKategorie";
import styles from "./App.module.css";

function Home() {
  const location = useLocation();

  // Coming from another page (e.g. /sortiment/schuhe) via a "/#id" link needs
  // an explicit scroll here — React Router doesn't auto-scroll to a hash the
  // way a full page load would.
  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.slice(1);
    // A single rAF fired too early right after navigating in from a
    // different route (layout not yet settled); a short timeout is more
    // reliable for the freshly mounted page to finish laying out first.
    const timer = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => clearTimeout(timer);
  }, [location]);

  return (
    <>
      <Hero />
      <UeberUns />
      <Sortiment />
      <OeffnungszeitenKontakt />
      <Footer />
    </>
  );
}

export default function App() {
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.main}>
        <MobileHeader isOpen={isDrawerOpen} onToggle={() => setDrawerOpen((v) => !v)} />
        <MobileDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sortiment/:kategorie" element={<SortimentKategorie />} />
          <Route path="/impressum" element={<Impressum />} />
          <Route path="/datenschutz" element={<Datenschutz />} />
        </Routes>
      </div>
      <CallFAB />
    </div>
  );
}
