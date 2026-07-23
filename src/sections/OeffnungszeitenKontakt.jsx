import { MapPin, Phone, EnvelopeSimple, Clock } from "@phosphor-icons/react";
import SectionHeading from "../components/SectionHeading";
import ContactForm from "../components/ContactForm";
import MapView from "../components/MapView";
import { address, contact, openingHours } from "../data/content";
import styles from "./OeffnungszeitenKontakt.module.css";

// TODO: Hausnummer vor Launch mit Christina abgleichen — manche Verzeichnisse
// listen "Hauptstraße 61-63" statt "Hauptstraße 61".

export default function OeffnungszeitenKontakt() {
  return (
    <section id="kontakt" className="section">
      <div className="container">
        <SectionHeading eyebrow="Öffnungszeiten & Kontakt" title="Schau vorbei" align="center" />

        <div className={styles.grid}>
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

          <ContactForm />
        </div>
      </div>

      <div className={styles.mapBleed}>
        <MapView />
      </div>
    </section>
  );
}
