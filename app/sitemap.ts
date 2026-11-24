import type { MetadataRoute } from "next";
import { URL_PUBLICA } from "@/lib/seo";

// Només la portada: el gestor i les pantalles no s'han d'indexar.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${URL_PUBLICA}/`, lastModified: new Date(), changeFrequency: "monthly", priority: 1 }];
}
