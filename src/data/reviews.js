// Fixed set of 5-star reviews shown in the "Was unsere Kundinnen und Kunden
// sagen" section — no live Google Places API involved (that integration was
// removed; see worker/index.js history). Sourced from the real Google Maps
// listing (place_id ChIJE5MFMwvDvkcRkF5K4vLeLmM) on 2026-08-28. To change
// what's shown, edit this array directly: add, remove, or rewrite an entry,
// no other file needs to change.
export const reviews = [
  {
    id: "review-1",
    authorName: "Irene Werheid",
    rating: 5,
    relativeTime: "vor 2 Monaten",
    text: "Eine sehr gut sortierte Boutique, die für jeden etwas anzubieten hat. Mode, wie man sie mag und tolle Accessoires. Alle sind sehr nett, freundlich und sehr kompetent. Man wird top beraten und fühlt sich dort einfach wohl.",
  },
  {
    id: "review-2",
    authorName: "Anne Hanses",
    rating: 5,
    relativeTime: "vor 2 Monaten",
    text: "Wir haben einen super Mädelsabend mit Sekt und Knabbereien bei Christina Ley erlebt. Ihr Angebot ist auch sehenswert. Mit einer Jeans, die ich ohne die professionelle Beratung von ihr, nicht gekauft hätte, bin ich glücklich nach Hause gegangen.",
  },
  {
    id: "review-3",
    authorName: "Nicole Zimmermann",
    rating: 5,
    relativeTime: "vor 7 Monaten",
    text: "Sei bunt - sei leise - sei uni - sei laut - sei DU! Ich fühle mich in der Boutique mit den Dingen - und den Menschen - immer aufgehoben und ehrlich kompetent beraten! Ein Ort an dem alle was finden - und auch viel Platz für „Kleinigkeiten“ ist. Ich empfehle uneingeschränkt!",
  },
  {
    id: "review-4",
    authorName: "Nadja Sell",
    rating: 5,
    relativeTime: "vor einem Jahr",
    text: "Eine tolle Boutique in Neunkirchen, die für jeden Geldbeutel und Geschmack etwas Schönes bereithält. Man wird herzlich empfangen und beraten von den Mitarbeiterinnen. Die Inhaberin führt mit viel Herz ihre Boutique. Ich sage nur, einfach reingehen und wohlfühlen und dabei das ein oder andere Kleidungsstück mit nach Hause nehmen.",
  },
  {
    id: "review-5",
    authorName: "Antje Ritter",
    rating: 5,
    relativeTime: "vor 6 Jahren",
    text: "Schöne kleine Boutique mit Überraschungseffekt. Sehr freundliches Personal. Tolles umfangreiches Angebot qualitativ sehr hochwertiger Bekleidungsartikel. Mir gefällt, dass ich Bekleidung regional im Dorf kaufen kann - ohne überflüssige Kilometer zu fahren und dazu Kraftstoff & Zeit spare.",
  },
];
