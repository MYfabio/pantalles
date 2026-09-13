/**
 * Where an image goes in each panel layout, and how big.
 *
 * The panel lays its cards out differently depending on how many blocks are
 * active, so each card's image slot has a different shape. This is the single
 * description of those slots: PanelDisplay draws them from it, and the editor
 * reads it to tell people the ideal size and hand them the matching Canva
 * template. Keep the two in step by changing only this file.
 *
 * Sizes are the Canva templates' canvas sizes. What matters on screen is the
 * ratio — the panel scales the image to its card — but quoting the template's
 * own pixel size means "make it exactly this" is always true.
 */

export interface ImageSlot {
  width: number;
  height: number;
  /** Human-readable ratio, e.g. "4:3". */
  ratio: string;
  /** Canva template with a canvas of exactly this size. */
  canvaUrl: string;
  canvaTitle: string;
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

/** Every distinct slot, for the help page. */
export const IMAGE_SLOTS = { FULL, TALL, WIDE, SMALL } as const;

/**
 * The slot for the card at `index` among `activeCount` active blocks, or null
 * when that card shows no image.
 *
 * Mirrors the grid rules in PanelDisplay: one block fills the screen, two sit
 * side by side, three put the first one wide across the top, four make a 2x2
 * grid, and five put "general" wide across the top over a 2x2 grid. With five
 * blocks the small cards are too short to fit a picture and still be readable
 * from a corridor, so only the wide one carries an image.
 */
export function imageSlotFor(activeCount: number, index: number, key: string): ImageSlot | null {
  if (activeCount <= 1) return FULL;
  if (activeCount === 2) return TALL;
  if (activeCount === 3) return index === 0 ? WIDE : SMALL;
  if (activeCount === 4) return SMALL;
  return key === "general" ? WIDE : null;
}

/** Short description of the layout, for the editor. */
export function layoutLabel(activeCount: number): string {
  switch (Math.max(1, activeCount)) {
    case 1:
      return "1 bloc: pantalla completa";
    case 2:
      return "2 blocs: dues columnes";
    case 3:
      return "3 blocs: un d'ample i dos a sota";
    case 4:
      return "4 blocs: quadrícula 2×2";
    default:
      return "5 blocs: General ample i quatre petits";
  }
}
