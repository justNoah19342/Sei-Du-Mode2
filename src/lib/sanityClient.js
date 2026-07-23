import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";

// TODO: Werte kommen aus .env (siehe .env.example) — erst gueltig, sobald ein
// echtes Sanity-Projekt existiert (siehe Anleitung "Sanity-Projekt aufsetzen").
const projectId = import.meta.env.VITE_SANITY_PROJECT_ID;
const dataset = import.meta.env.VITE_SANITY_DATASET || "production";

export const isSanityConfigured = Boolean(projectId);

export const sanityClient = isSanityConfigured
  ? createClient({
      projectId,
      dataset,
      apiVersion: "2024-01-01",
      useCdn: true,
    })
  : null;

const builder = isSanityConfigured ? imageUrlBuilder(sanityClient) : null;

export function urlForImage(source) {
  return builder ? builder.image(source) : null;
}
