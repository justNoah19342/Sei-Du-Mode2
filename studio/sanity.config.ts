import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./schemaTypes";

export default defineConfig({
  name: "default",
  title: "SEI DU Mode",

  projectId: "b9np6jbh",
  dataset: "production",

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Inhalt")
          .items([
            // Singleton: always the same fixed document, no "create new" list.
            S.listItem()
              .title("Ankündigungsbalken")
              .id("ankuendigungsbalken")
              .child(
                S.document()
                  .schemaType("ankuendigungsbalken")
                  .documentId("ankuendigungsbalken")
              ),
            S.divider(),
            ...S.documentTypeListItems().filter(
              (item) => item.getId() !== "ankuendigungsbalken"
            ),
          ]),
    }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
  },
});
