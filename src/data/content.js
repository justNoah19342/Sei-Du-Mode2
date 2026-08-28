// Einzige Quelle der Wahrheit fuer alle Fakten. Keine Fakten in Komponenten neu eintippen.

export const business = {
  legalName: 'Christina Ley "Sei Du" Mode',
  publicName: "SEI DU Mode",
  publicNameAlt: "SEI DU Boutique",
  owner: "Christina Ley",
};

export const address = {
  street: "Zeithstraße 131",
  zip: "53819",
  city: "Neunkirchen-Seelscheid",
  full: "Zeithstraße 131, 53819 Neunkirchen-Seelscheid",
};

export const contact = {
  phone: "+49 2247 7589139",
  phoneHref: "tel:+4922477589139",
  email: "seidu1966@gmail.com",
  emailHref: "mailto:seidu1966@gmail.com",
};

export const openingHours = [
  { days: "Montag – Freitag", hours: "9:00 – 19:00 Uhr" },
  { days: "Samstag", hours: "9:00 – 14:00 Uhr" },
  { days: "Sonntag", hours: "geschlossen" },
];

export const social = {
  facebook: "https://facebook.com/seiduchristinaley",
  instagram: "https://www.instagram.com/seidumode/",
};

// Precise Place ID link (not a name-based search) — points at exactly this
// listing regardless of similarly-named businesses nearby.
export const googleReviewHref = "https://www.google.com/maps/place/?q=place_id:ChIJE5MFMwvDvkcRkF5K4vLeLmM";

// Opens Google Maps with turn-by-turn directions straight to this address —
// destination_place_id pins it to the exact listing above (same Place ID as
// googleReviewHref), destination is just the human-readable fallback Google
// shows/uses if the place id ever stops resolving.
export const googleMapsDirectionsHref =
  "https://www.google.com/maps/dir/?api=1&destination=" +
  encodeURIComponent(address.full) +
  "&destination_place_id=ChIJE5MFMwvDvkcRkF5K4vLeLmM";

export const selbstbeschreibung =
  'Mode Boutique mit individueller Mode plus Schuhe, Taschen und Accessoires – nicht die üblichen Marken.';

export const werte = [
  {
    title: "Kein Kaufdruck",
    text: "Entspanntes Stöbern und Anprobieren, ganz ohne Verkaufsdruck.",
  },
  {
    title: "Persönliche Beratung",
    text: "Christina berät ehrlich und persönlich, ganz ohne einstudierte Verkaufssprüche.",
  },
  {
    title: "Faire Preise, hohe Qualität",
    text: "Gute Qualität zu einem Preis, der stimmt.",
  },
  {
    title: "Einzigartiges Sortiment",
    text: "Eine Auswahl, die man nicht an jeder Ecke findet, bewusst ohne Massenmarken.",
  },
];

export const regionInfo =
  "Neunkirchen-Seelscheid liegt im Rhein-Sieg-Kreis in Nordrhein-Westfalen und zählt rund 20.283 Einwohner (Stand 31.12.2024).";

// TODO: Gruendungsjahr/Firmengeschichte ergaenzen, sobald Christina Details liefert.
// TODO: echte Kundenzitate/Testimonials einfuegen, sobald freigegeben — aktuell nicht gerendert.
