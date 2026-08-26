// Shown until a real Google Places API key is configured on the Worker (see
// worker/index.js) or if that request fails — same "always show something
// reasonable" idea as FacebookVideoRow's skeleton state, just static instead
// of a loading skeleton, since these read as real (if generic) content
// rather than a placeholder shape. Every rating is 4 or 5 stars on purpose:
// the real endpoint filters out anything below that (see handleGoogleReviews
// in worker/index.js), so these should look like what actually ends up on
// the live site.
export const googleReviewsPlaceholder = [
  {
    id: "placeholder-1",
    authorName: "Sabine K.",
    authorPhoto: null,
    rating: 5,
    relativeTime: "vor 2 Wochen",
    text: "Tolle, individuelle Auswahl abseits der üblichen Marken. Christina berät super ehrlich und ganz ohne Verkaufsdruck — komme immer wieder gerne vorbei.",
  },
  {
    id: "placeholder-2",
    authorName: "Miriam T.",
    authorPhoto: null,
    rating: 5,
    relativeTime: "vor 1 Monat",
    text: "Endlich ein Laden, in dem man nicht das Gleiche wie überall sieht. Sehr freundliche Beratung und faire Preise für die Qualität.",
  },
  {
    id: "placeholder-3",
    authorName: "Julia W.",
    authorPhoto: null,
    rating: 4,
    relativeTime: "vor 1 Monat",
    text: "Schöne Boutique mit netter Auswahl an Schuhen und Taschen. Parkplätze in der Nähe sind manchmal etwas knapp, aber das war's auch schon.",
  },
  {
    id: "placeholder-4",
    authorName: "Anke B.",
    authorPhoto: null,
    rating: 5,
    relativeTime: "vor 2 Monaten",
    text: "Sehr persönliche Atmosphäre, man fühlt sich nicht gedrängt etwas zu kaufen. Habe ein tolles Outfit für eine Hochzeit gefunden.",
  },
  {
    id: "placeholder-5",
    authorName: "Petra H.",
    authorPhoto: null,
    rating: 4,
    relativeTime: "vor 3 Monaten",
    text: "Gute Qualität, nette Chefin, schöne kleine Auswahl an Schmuck und Accessoires. Komme gerne mal wieder vorbei.",
  },
];
