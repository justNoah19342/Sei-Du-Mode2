import { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import AnnouncementBar from "./components/AnnouncementBar";
import CookieBanner from "./components/CookieBanner";
import SectionColorBubble from "./components/SectionColorBubble";
import Sidebar from "./components/Sidebar";
import MobileHeader from "./components/MobileHeader";
import MobileDrawer from "./components/MobileDrawer";
import CallFAB from "./components/CallFAB";
import Hero from "./sections/Hero";
import LogoCarousel from "./sections/LogoCarousel";
import UeberUns from "./sections/UeberUns";
import Sortiment from "./sections/Sortiment";
import SocialMedia from "./sections/SocialMedia";
import OeffnungszeitenKontakt from "./sections/OeffnungszeitenKontakt";
import Footer from "./sections/Footer";
import Impressum from "./pages/Impressum";
import Datenschutz from "./pages/Datenschutz";
import DesignPreview from "./pages/DesignPreview";
import styles from "./App.module.css";

function Home() {
  const location = useLocation();

  // Coming from another page (e.g. /datenschutz) via a "/#id" link needs
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
      <LogoCarousel />
      <Sortiment />
      <SocialMedia />
      <OeffnungszeitenKontakt />
      <Footer />
    </>
  );
}

export default function App() {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  // Bubble tracks section colors that only exist on the homepage (see
  // sectionRevealStore.js) — on Impressum/Datenschutz there's nothing for it
  // to track, so it would just sit there frozen at whatever color/position
  // it last had instead of disappearing like it should.
  const isHome = useLocation().pathname === "/";

  return (
    <>
      <AnnouncementBar />
      {isHome && <SectionColorBubble />}
      <div className={styles.layout}>
        <Sidebar />
        <div className={styles.main}>
          <MobileHeader isOpen={isDrawerOpen} onToggle={() => setDrawerOpen((v) => !v)} />
          <MobileDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/impressum" element={<Impressum />} />
            <Route path="/datenschutz" element={<Datenschutz />} />
            <Route path="/design-preview" element={<DesignPreview />} />
          </Routes>
        </div>
        <CallFAB />
      </div>
      <CookieBanner />
    </>
  );
}
