import type { MetadataRoute } from "next";
import { BOTS_CERCA_IA, BOTS_ENTRENAMENT } from "@/lib/bots";
import { URL_PUBLICA } from "@/lib/seo";

// Zones sense contingut públic: l'API, el gestor, l'accés i les pantalles del centre
// (/panel i /display mostren als monitors els avisos de cada centre).
const PRIVAT = ["/api/", "/dashboard", "/login", "/panel/", "/display/"];

// Els cercadors i els assistents que citen amb enllaç poden entrar a les pàgines públiques;
// els bots que copien el web per entrenar models no poden entrar enlloc.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVAT },
      { userAgent: BOTS_CERCA_IA, allow: "/", disallow: PRIVAT },
      { userAgent: BOTS_ENTRENAMENT, disallow: "/" },
    ],
    sitemap: `${URL_PUBLICA}/sitemap.xml`,
  };
}
