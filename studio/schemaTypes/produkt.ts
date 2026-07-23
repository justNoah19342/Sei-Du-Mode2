import { defineField, defineType } from "sanity";

// Werte muessen exakt mit den Kategorie-Keys im Frontend uebereinstimmen
// (seidumode2/src/data/sortiment.js).
export const kategorien = [
  { title: "Kleidung", value: "kleidung" },
  { title: "Schuhe", value: "schuhe" },
  { title: "Taschen", value: "taschen" },
  { title: "Accessoires", value: "accessoires" },
  { title: "Schmuck", value: "schmuck" },
];

export default defineType({
  name: "produkt",
  title: "Produkt",
  type: "document",
  fields: [
    defineField({
      name: "image",
      title: "Bild",
      description: "Erscheint oben auf der Produktkarte.",
      type: "image",
      options: { hotspot: true },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "kategorie",
      title: "Kategorie",
      description: "Bestimmt, auf welcher Sortiment-Unterseite das Produkt erscheint.",
      type: "string",
      options: { list: kategorien },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "beschreibung",
      title: "Kurze Beschreibung",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "reihenfolge",
      title: "Reihenfolge",
      description: "Kleinere Zahl erscheint weiter oben (optional).",
      type: "number",
    }),
  ],
  orderings: [
    {
      title: "Reihenfolge",
      name: "reihenfolgeAsc",
      by: [{ field: "reihenfolge", direction: "asc" }],
    },
  ],
  preview: {
    select: { title: "name", subtitle: "kategorie", media: "image" },
  },
});
