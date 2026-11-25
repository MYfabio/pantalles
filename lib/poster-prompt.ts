/**
 * El text que es dona a Gemini per crear el cartel d'una pantalla.
 *
 * La persona només escriu què vol comunicar; aquí s'hi afegeix tot el que
 * sempre ha de ser igual: la mida exacta de l'espai, que el text vagi en
 * català i es llegeixi de lluny, i els colors de la pantalla. El fa servir el
 * servidor per generar la imatge i l'editor per al botó «Copia el prompt», de
 * manera que el que es copia és exactament el que es genera.
 */

/** Espai que ocupa el cartel sota la capçalera (vegeu IMAGE_SLOTS.POSTER). */
export const POSTER_WIDTH = 1080;
export const POSTER_HEIGHT = 1600;
/** La proporció que accepta el model d'imatge més propera a 1080 × 1600. */
export const POSTER_RATIO = "2:3";

/** Una descripció més llarga no fa millors cartells i infla la petició. */
export const POSTER_DESCRIPTION_MAX = 600;

export function buildPosterPrompt({
  description,
  primary,
  dark,
}: {
  description: string;
  primary: string;
  dark: string;
}): string {
  const what = description.trim().slice(0, POSTER_DESCRIPTION_MAX);
  return `Crea un cartell vertical per a una pantalla digital d'un institut de secundària de Catalunya.

Què ha de comunicar el cartell:
"""
${what}
"""

Format:
- Vertical, proporció ${POSTER_RATIO}, pensat per a ${POSTER_WIDTH} × ${POSTER_HEIGHT} píxels.
- Ocupa tot el llenç, sense marges blancs ni vores.

Text:
- Tot el text que aparegui ha d'estar en català, amb l'ortografia correcta i els accents.
- Copia exactament les dades que surten a la descripció (dates, hores, llocs, noms). No n'inventis cap.
- Poques paraules i molt grans: s'ha de llegir d'un cop d'ull a tres o quatre metres de distància.
- Un títol destacat i, com a molt, dues o tres línies més. Contrast fort entre el text i el fons.

Estil:
- Modern, net i alegre, adequat per a alumnat adolescent i professorat.
- Colors principals ${primary} i ${dark}, amb blanc per al text sobre fons fosc.

No posis logotips, marques d'aigua ni codis QR. No hi surtin cares de persones reals reconeixibles.`;
}
