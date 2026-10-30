import type { MetadataRoute } from "next";

const BASE = "https://kiosko.aulaia.cat";

// Només la portada: el gestor i les pantalles no s'han d'indexar.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: BASE, lastModified: new Date(), changeFrequency: "monthly", priority: 1 }];
}
