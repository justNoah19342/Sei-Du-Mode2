import { useState } from "react";
import AppointmentPicker, { formatAppointmentLine } from "./AppointmentPicker";
import styles from "./ContactForm.module.css";

// Web3Forms takes submissions at one fixed endpoint for every user — which
// form/inbox it's for is determined by the access_key sent along in the
// body, not by the URL (unlike Formspree's per-form endpoint URL this
// replaced).
const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";
const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;
const isConfigured = Boolean(accessKey);

export default function ContactForm() {
  const [status, setStatus] = useState("idle");
  const [appointment, setAppointment] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");

    const formData = new FormData(e.target);
    if (appointment) {
      const message = formData.get("message") || "";
      formData.set("message", `${formatAppointmentLine(appointment)}\n\n${message}`);
    }
    formData.set("access_key", accessKey);

    try {
      const response = await fetch(WEB3FORMS_ENDPOINT, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
      });
      // Web3Forms always answers 200 with its own { success: boolean } body
      // (e.g. a bad access_key still comes back as HTTP 200) — response.ok
      // alone would treat that as a success.
      const result = await response.json().catch(() => null);
      setStatus(result?.success ? "success" : "error");
      if (result?.success) e.target.reset();
    } catch {
      setStatus("error");
    }
  };

  if (!isConfigured) {
    return (
      <div className={styles.card}>
        <h3>Schreib uns</h3>
        <p className={styles.notice}>
          Das Kontaktformular ist noch nicht mit einem Versanddienst verbunden. Sobald das eingerichtet
          ist, kannst du hier direkt eine Nachricht hinterlassen.
        </p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className={styles.card}>
        <h3>Nachricht angekommen</h3>
        <p className={styles.notice}>Danke dir! Wir melden uns so schnell wie möglich zurück.</p>
      </div>
    );
  }

  return (
    <form className={styles.card} onSubmit={handleSubmit}>
      <h3>Schreib uns</h3>

      <label className={styles.field}>
        <span>Name</span>
        <input type="text" name="name" required autoComplete="name" />
      </label>

      <label className={styles.field}>
        <span>E-Mail</span>
        <input type="email" name="email" required autoComplete="email" />
      </label>

      <AppointmentPicker value={appointment} onChange={setAppointment} />

      <label className={styles.field}>
        <span>Nachricht</span>
        <textarea name="message" rows={4} required />
      </label>

      <button type="submit" className={styles.submit} disabled={status === "sending"}>
        {status === "sending" ? "Wird gesendet …" : "Nachricht senden"}
      </button>

      {status === "error" && (
        <p className={styles.error}>Das hat leider nicht geklappt. Ruf uns gern direkt an oder versuch es erneut.</p>
      )}
    </form>
  );
}
