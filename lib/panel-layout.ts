/**
 * Where an image goes in each panel layout, and how big.
 *
 * The panel lays its cards out differently depending on how many blocks are
 * active, so each card's image slot has a different shape. This is the single
 * description of those slots: PanelDisplay draws them from it, and the editor
 * reads it to tell people the ideal size and hand them the matching Canva
 * template. Keep the two in step by changing only this file.
 *
 * Els panells són verticals: dues targetes una al costat de l'altra queden
 * estretes i altes i el text no hi cap. Per això, amb dos i tres blocs les
 * targetes van una sota l'altra (files), amb la imatge a l'esquerra; només la
 * quadrícula de quatre fa servir columnes. Amb cinc, el General va ample a
 * dalt i els altres quatre fan la mateixa quadrícula.
 */

export interface ImageSlot {
  width: number;
  height: number;
  /** Human-readable ratio, e.g. "4:3". */
  ratio: string;
  /** Canva template with a canvas of exactly this size, if there is one. */
  canvaUrl?: string;
  canvaTitle?: string;
}

const FULL: ImageSlot = {
  width: 1016,
  height: 762,
  ratio: "4:3",
  canvaUrl: "https://canva.link/x2lkyil3cm62ryj",
  canvaTitle: "Pantalla completa",
};

const TALL: ImageSlot = {
  width: 498,
  height: 622,
  ratio: "4:5",
  canvaUrl: "https://canva.link/co0z0n5n8bo1wwx",
  canvaTitle: "Dos columnes altes",
};

const WIDE: ImageSlot = {
  width: 1016,
  height: 571,
  ratio: "16:9",
  canvaUrl: "https://canva.link/ktyz8hcyv9g5vf3",
  canvaTitle: "Bloc ample",
};

const SMALL: ImageSlot = {
  width: 498,
  height: 374,
  ratio: "4:3",
  canvaUrl: "https://canva.link/cnunpldh2jkqcr4",
  canvaTitle: "Quadrícula",
};

/**
 * Imatge a pantalla completa: ocupa tot el que hi ha sota la capçalera. La
 * capçalera canvia d'alçada segons el que mostri (rellotge, sostenibilitat,
 * frase), així que la imatge es retalla pel centre; aquesta mida és la d'una
 * capçalera normal. No hi ha plantilla de Canva feta per a aquesta mida.
 */
const POSTER: ImageSlot = {
  width: 1080,
  height: 1600,
  ratio: "2:3",
};

/** Every distinct slot, for the help page. */
export const IMAGE_SLOTS = { FULL, TALL, WIDE, SMALL, POSTER } as const;

export interface PanelLayout {
  columns: number;
  rows: number;
  /** Targetes horitzontals: la imatge a l'esquerra i el text a la dreta. */
  sideImage: boolean;
}

/** How the content area is split for `activeCount` active blocks. */
export function layoutFor(activeCount: number): PanelLayout {
  const n = Math.max(1, activeCount);
  if (n === 1) return { columns: 1, rows: 1, sideImage: false };
  if (n === 2) return { columns: 1, rows: 2, sideImage: true };
  if (n === 3) return { columns: 1, rows: 3, sideImage: true };
  if (n === 4) return { columns: 2, rows: 2, sideImage: false };
  return { columns: 2, rows: 3, sideImage: false };
}

/** The card that spans both columns in the five-block layout. */
export function spansFullWidth(activeCount: number, key: string): boolean {
  return activeCount >= 5 && key === "general";
}

/**
 * The slot for the card at `index` among `activeCount` active blocks, or null
 * when that card shows no image.
 *
 * With five blocks the small cards are too short to fit a picture and still be
 * readable from a corridor, so only the wide one carries an image.
 */
export function imageSlotFor(activeCount: number, index: number, key: string): ImageSlot | null {
  if (activeCount <= 1) return FULL;
  if (activeCount === 2) return TALL;
  if (activeCount === 3) return SMALL;
  if (activeCount === 4) return SMALL;
  return key === "general" ? WIDE : null;
}

/** Short description of the layout, for the editor. */
export function layoutLabel(activeCount: number): string {
  switch (Math.max(1, activeCount)) {
    case 1:
      return "1 bloc: pantalla completa";
    case 2:
      return "2 blocs: dues files";
    case 3:
      return "3 blocs: tres files";
    case 4:
      return "4 blocs: quadrícula 2×2";
    default:
      return "5 blocs: General ample i quatre a sota";
  }
}
