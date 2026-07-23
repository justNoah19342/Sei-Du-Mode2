import LegalPage from "./LegalPage";
import { business, address, contact } from "../data/content";

// TODO: rechtlich geprueften Impressum-Text mit Christina abgleichen, bevor
// die Seite live geht (insbesondere die als Platzhalter markierten Angaben).

export default function Impressum() {
  return (
    <LegalPage title="Impressum">
      <h2>Angaben gemäß § 5 TMG</h2>
      <p>
        {business.legalName}
        <br />
        {business.owner}
        <br />
        {address.full}
      </p>

      <h2>Vertreten durch</h2>
      <p>{business.owner}</p>

      <h2>Kontakt</h2>
      <p>
        Telefon: {contact.phone}
        <br />
        E-Mail: {contact.email}
      </p>

      <h2>Umsatzsteuer-ID</h2>
      <p>
        Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:
        <br />
        [Platzhalter: USt-IdNr. bitte ergänzen, falls vorhanden]
      </p>

      <h2>Rechtsform</h2>
      <p>
        [Platzhalter: Rechtsform bestätigen, z. B. Einzelunternehmen]
      </p>

      <h2>Redaktionell verantwortlich</h2>
      <p>
        {business.owner}
        <br />
        {address.full}
      </p>

      <h2>EU-Streitschlichtung</h2>
      <p>
        Die Europäische Kommission stellt eine Plattform zur
        Online-Streitbeilegung (OS) bereit:{" "}
        <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer">
          https://ec.europa.eu/consumers/odr/
        </a>
        . [Platzhalter: E-Mail-Adresse für Beschwerden bitte ergänzen, falls
        von der oben genannten abweichend.]
      </p>

      <h2>Verbraucherstreitbeilegung / Universalschlichtungsstelle</h2>
      <p>
        [Platzhalter: Angabe, ob die Teilnahme an einem
        Streitschlichtungsverfahren vor einer Verbraucherschlichtungsstelle
        erfolgt oder nicht, bitte mit Christina abstimmen.]
      </p>

      <h2>Verwendete Software</h2>
      <p>
        Diese Website nutzt folgende Open-Source-Komponenten: Phosphor Icons,
        React, React Router und Framer Motion (alle unter MIT-Lizenz) sowie
        die Schriftarten Fraunces und Jost (unter SIL Open Font License 1.1).
        Die Karte nutzt MapLibre GL (BSD-3-Clause-Lizenz) mit Kartendaten von{" "}
        <a href="https://openfreemap.org" target="_blank" rel="noopener noreferrer">
          OpenFreeMap
        </a>{" "}
        und{" "}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
          © OpenStreetMap-Mitwirkenden
        </a>
        .
      </p>
    </LegalPage>
  );
}
