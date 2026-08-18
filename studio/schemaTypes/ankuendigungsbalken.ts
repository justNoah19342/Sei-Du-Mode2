import { defineField, defineType } from "sanity";

// Singleton — see sanity.config.ts structure builder, which pins this to a
// single fixed document instead of a normal list.
export default defineType({
  name: "ankuendigungsbalken",
  title: "Ankündigungsbalken",
  type: "document",
  fields: [
    defineField({
      name: "text",
      title: "Text",
      description:
        'Läuft als durchlaufender Schriftzug oben auf der Website, z.B. "20% Rabatt auf alles" oder "Lieferung ist eingetroffen".',
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "aktiv",
      title: "Sichtbar",
      description: "Balken ein-/ausblenden, ohne den Text zu löschen.",
      type: "boolean",
      initialValue: true,
    }),
  ],
  preview: {
    select: { title: "text", subtitle: "aktiv" },
    prepare({ title, subtitle }) {
      return {
        title: title || "(kein Text)",
        subtitle: subtitle ? "Sichtbar" : "Ausgeblendet",
      };
    },
  },
});
