import { useState } from "react";
import AppointmentPicker, { formatAppointmentLine } from "./AppointmentPicker";
import styles from "./ContactForm.module.css";

const endpoint = import.meta.env.VITE_FORMSPREE_ENDPOINT;
const isConfigured = Boolean(endpoint);

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

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
      });
      setStatus(response.ok ? "success" : "error");
      if (response.ok) e.target.reset();
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
