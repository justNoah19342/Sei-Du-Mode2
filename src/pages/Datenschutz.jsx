import LegalPage from "./LegalPage";

export default function Datenschutz() {
  return (
    <LegalPage title="Datenschutzerklärung">
      {/* TODO: rechtlich geprueften Datenschutztext ergaenzen (DSGVO-konform). */}
      <p>
        Diese Seite wird derzeit vorbereitet. Die vollständige, DSGVO-konforme
        Datenschutzerklärung wird in Kürze ergänzt.
      </p>
      <p>
        Eingebettete Facebook-Videos: Auf unserer Seite können Facebook-Videos eingebunden
        sein. Diese werden erst geladen, nachdem du dem im Cookie-Hinweis aktiv zugestimmt
        hast. Beim Laden eines Videos wird eine Verbindung zu Servern von Meta Platforms
        Ireland Ltd. hergestellt, wobei deine IP-Adresse übermittelt und Cookies gesetzt
        werden können. Deine Zustimmung kannst du jederzeit widerrufen, indem du die
        gespeicherten Website-Daten deines Browsers löschst.
      </p>
    </LegalPage>
  );
}
