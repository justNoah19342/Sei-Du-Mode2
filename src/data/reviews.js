// Fixed set of 5-star reviews shown in the "Was unsere Kundinnen und Kunden
// sagen" section — no live Google Places API involved (that integration was
// removed; see worker/index.js history). To change what's shown, edit this
// array directly: add, remove, or rewrite an entry, no other file needs to
// change.
export const reviews = [
  {
    id: "review-1",
    authorName: "Sabine K.",
    rating: 5,
    relativeTime: "vor 2 Wochen",
    text: "Tolle, individuelle Auswahl abseits der üblichen Marken. Christina berät super ehrlich und ganz ohne Verkaufsdruck — komme immer wieder gerne vorbei. Man merkt sofort, dass hier mit Liebe ausgesucht wird und nicht einfach nachbestellt, was gerade im Trend ist. Absolute Empfehlung für alle, die mal was anderes suchen.",
  },
  {
    id: "review-2",
    authorName: "Miriam T.",
    rating: 5,
    relativeTime: "vor 1 Monat",
    text: "Endlich ein Laden, in dem man nicht das Gleiche wie überall sieht. Sehr freundliche Beratung und faire Preise für die Qualität. Ich war auf der Suche nach etwas Besonderem für einen runden Geburtstag und wurde wirklich fündig — inklusive ehrlicher Rückmeldung, was mir steht und was nicht.",
  },
  {
    id: "review-3",
    authorName: "Anke B.",
    rating: 5,
    relativeTime: "vor 2 Monaten",
    text: "Sehr persönliche Atmosphäre, man fühlt sich nicht gedrängt etwas zu kaufen. Habe ein tolles Outfit für eine Hochzeit gefunden — inklusive passender Tasche und Schuhen dazu, alles aus einer Hand und wirklich stimmig aufeinander abgestimmt. Werde definitiv wiederkommen, wenn der nächste Anlass ansteht.",
  },
  {
    id: "review-4",
    authorName: "Thomas M.",
    rating: 5,
    relativeTime: "vor 3 Monaten",
    text: "War eher zufällig hier und positiv überrascht — auch für Männer eine schöne kleine Auswahl abseits der üblichen Ketten. Ehrliche Beratung ohne Verkaufsdruck, habe eine Tasche gefunden, die ich sonst nirgends gesehen habe.",
  },
  {
    id: "review-5",
    authorName: "Katharina R.",
    rating: 5,
    relativeTime: "vor 4 Monaten",
    text: "Komme seit Jahren immer wieder gerne vorbei — die Auswahl an Schuhen und Taschen ist jedes Mal wieder anders und nie das, was man sonst überall sieht. Beratung ist ehrlich, entspannt und ohne jeden Verkaufsdruck. Für mich mittlerweile die erste Adresse in der Gegend, wenn ich etwas Besonderes suche, das nicht jede zweite Frau auch trägt.",
  },
];
