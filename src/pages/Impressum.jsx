import LegalPage from "./LegalPage";
import { business, address, contact, legal } from "../data/content";

export default function Impressum() {
  return (
    <LegalPage title="Impressum">
      <h2>Angaben gemäß § 5 DDG</h2>
      <p>
        Einzelunternehmen {business.legalName}
        <br />
        {address.full}
      </p>

      <h2>Kontakt</h2>
      <p>
        Telefon: {contact.phone}
        <br />
        E-Mail: {contact.email}
      </p>

      <h2>Umsatzsteuer-ID</h2>
      <p>{legal.ustId}</p>

      <h2>Redaktionell verantwortlich</h2>
      <p>
        {business.owner}
        <br />
        {address.full}
      </p>
    </LegalPage>
  );
}
