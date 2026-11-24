import type { Metadata } from "next";

/**
 * Adreça pública canònica. Les URL canòniques, l'og:url i el sitemap en depenen.
 * És fixa (no ve de cap variable d'entorn) perquè el domini tècnic de Railway o una
 * instal·lació de prova no s'anunciïn mai als cercadors com a adreça bona.
 */
export const URL_PUBLICA = "https://kiosko.aulaia.cat";

export const NOM_SITE = "Kiosko";

/** Foto de la portada: alumnat consultant un panell al pati. */
export const IMATGE_OG = {
  url: "/kiosko-pati.jpg",
  width: 1376,
  height: 768,
  alt: "Alumnat consultant un panell Kiosko al pati del centre",
};

/**
 * Metadades d'una pàgina pública: canònica, Open Graph i targeta de X/Twitter.
 * Next.js substitueix (no fusiona) l'objecte openGraph del layout quan una pàgina en defineix un,
 * per això cada pàgina el rep sencer des d'aquí. El layout no en posa cap, perquè les pàgines
 * privades (gestor, pantalles, login) no heretin canònica ni og:url.
 */
export function metadadesPublica({ titol, descripcio, cami }: {
  titol: string; descripcio: string; cami: string;
}): Metadata {
  return {
    title: { absolute: titol },
    description: descripcio,
    alternates: { canonical: cami },
    openGraph: {
      title: titol,
      description: descripcio,
      url: cami,
      siteName: NOM_SITE,
      images: [IMATGE_OG],
      locale: "ca_ES",
      type: "website",
    },
    twitter: { card: "summary_large_image", title: titol, description: descripcio, images: [IMATGE_OG.url] },
  };
}

/** Metadades de les pàgines privades: fora dels cercadors encara que algú n'enllaci una. */
export const METADADES_PRIVADA: Metadata = { robots: { index: false, follow: false } };

/** JSON-LD dins un <script> sense risc d'injecció d'HTML. */
export const jsonLdSegur = (dades: unknown) => JSON.stringify(dades).replace(/</g, "\\u003c");
