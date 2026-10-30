import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: ["/$", "/_next/"], disallow: "/" },
    sitemap: "https://kiosko.aulaia.cat/sitemap.xml",
  };
}
