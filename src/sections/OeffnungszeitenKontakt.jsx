import { lazy, Suspense } from "react";
import { MapPin, Phone, EnvelopeSimple, Clock, Image } from "@phosphor-icons/react";
import SectionHeading from "../components/SectionHeading";
import ContactForm from "../components/ContactForm";
import SectionReveal from "../components/SectionReveal";
import { address, contact, openingHours } from "../data/content";
import { getSectionInfo } from "../lib/sectionRevealStore";
import styles from "./OeffnungszeitenKontakt.module.css";

const { index: SECTION_INDEX, color: SECTION_COLOR } = getSectionInfo("kontakt");

// maplibre-gl is by far the single largest dependency in the app (bigger
// than every other library combined) — lazy so it's a separate chunk the
// browser only fetches once this section actually mounts, instead of
// blocking the initial page load for a map near the very bottom of the page.
const MapView = lazy(() => import("../components/MapView"));

// TODO: Hausnummer vor Launch mit Christina abgleichen — manche Verzeichnisse
// listen "Hauptstraße 61-63" statt "Hauptstraße 61".

export default function OeffnungszeitenKontakt() {
  return (
    <section id="kontakt" className="section">
      <SectionReveal index={SECTION_INDEX} color={SECTION_COLOR} />
      <div className="container">
        <SectionHeading eyebrow="Öffnungszeiten & Kontakt" title="Schau vorbei" align="center" />

        <div className={styles.grid}>
          <div className={styles.photoPlaceholder} aria-hidden="true">
            <Image size={32} weight="light" />
            <span>Platzhalter</span>
          </div>

          <ul className={styles.infoList}>
            <li>
              <Clock size={22} weight="light" />
              <div>
                {openingHours.map((row) => (
                  <p key={row.days}>
                    {row.days}: {row.hours}
                  </p>
                ))}
              </div>
            </li>
            <li>
              <MapPin size={22} weight="light" />
              <span>{address.full}</span>
            </li>
            <li>
              <Phone size={22} weight="light" />
              <a href={contact.phoneHref}>{contact.phone}</a>
            </li>
            <li>
              <EnvelopeSimple size={22} weight="light" />
              <a href={contact.emailHref}>{contact.email}</a>
            </li>
          </ul>

          <div className={styles.formArea}>
            <ContactForm />
          </div>
        </div>
      </div>

      <div className={styles.mapBleed}>
        <Suspense fallback={null}>
          <MapView />
        </Suspense>
      </div>
    </section>
  );
}
