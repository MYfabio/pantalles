/**
 * Aparença d'un panell: el color de la capçalera i del peu, i la mida de la
 * lletra dels blocs.
 *
 * Els colors de cada bloc (COLORS a PanelDisplay) no hi entren a propòsit:
 * diuen de quin tipus és el bloc (General, ESO, FP…) i han de ser els
 * mateixos a tots els panells del centre perquè es reconeguin d'un cop d'ull.
 *
 * Un panell sense aparença pròpia es veu exactament com fins ara, amb el
 * granat de l'Escola Industrial a dalt i a baix. Així els panells que ja
 * existien no canvien quan s'estrena aquest ajust; només canvia el que algú
 * decideixi canviar.
 */
export interface PanelTheme {
  /** Color de la capçalera. El text que hi va a sobre és blanc. */
  primary: string;
  /** Color del peu de pantalla. */
  dark: string;
  /** Multiplicador de la mida de lletra dels blocs: 1 és la mida de sempre. */
  fontScale: number;
}

/** Els camps tal com viuen al model Panel. Nuls vol dir "hereta del centre". */
export interface PanelThemeFields {
  themePrimary?: string | null;
  themeDark?: string | null;
  fontScale?: number | null;
}

export const DEFAULT_THEME: PanelTheme = { primary: "#a00842", dark: "#a00842", fontScale: 1 };

/**
 * Combinacions preparades. Totes tenen text blanc sobre la capçalera amb un
 * contrast d'almenys 4,5:1, que és el mínim per llegir de lluny.
 */
export const THEME_PRESETS: { id: string; label: string; primary: string; dark: string }[] = [
  { id: "institut", label: "Institut", primary: "#a00842", dark: "#7b1e48" },
  { id: "verd", label: "Verd", primary: "#1f6b4a", dark: "#154d35" },
  { id: "blau", label: "Blau nit", primary: "#1f2a47", dark: "#141c33" },
  { id: "ocre", label: "Ocre", primary: "#b85c00", dark: "#8a4400" },
  { id: "grafit", label: "Grafit", primary: "#2e2e33", dark: "#111114" },
  { id: "contrast", label: "Alt contrast", primary: "#000000", dark: "#ffd400" },
];

export const FONT_SCALES: { value: number; label: string }[] = [
  { value: 1, label: "Normal" },
  { value: 1.18, label: "Gran" },
  { value: 1.38, label: "Molt gran" },
];

export const FONT_SCALE_MIN = 0.8;
export const FONT_SCALE_MAX = 1.6;

/** Contrast mínim entre el text blanc i la capçalera perquè es llegeixi de lluny. */
export const MIN_CONTRAST = 4.5;

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}

export function clampFontScale(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!isFinite(n)) return 1;
  return Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, n));
}

/** El tema que es pinta a partir del que hi ha desat (o no) al panell. */
export function resolveTheme(fields: PanelThemeFields | null | undefined): PanelTheme {
  const primary = isHexColor(fields?.themePrimary) ? fields!.themePrimary!.toLowerCase() : null;
  const dark = isHexColor(fields?.themeDark) ? fields!.themeDark!.toLowerCase() : null;
  return {
    primary: primary ?? DEFAULT_THEME.primary,
    // Un color propi sense peu definit fa servir el mateix color a baix.
    dark: dark ?? primary ?? DEFAULT_THEME.dark,
    fontScale: fields?.fontScale == null ? 1 : clampFontScale(fields.fontScale),
  };
}

/** Quina combinació preparada correspon al tema, si n'hi ha cap. */
export function presetIdFor(fields: PanelThemeFields | null | undefined): string | null {
  if (!isHexColor(fields?.themePrimary)) return null;
  const theme = resolveTheme(fields);
  const hit = THEME_PRESETS.find((p) => p.primary === theme.primary && p.dark === theme.dark);
  return hit ? hit.id : null;
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** El to suau del fons dels blocs: el color de capçalera, gairebé transparent. */
export function tintFor(hex: string): string {
  const [r, g, b] = hexToRgb(isHexColor(hex) ? hex : DEFAULT_THEME.primary);
  return `rgba(${r}, ${g}, ${b}, 0.045)`;
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contrast entre dos colors segons les WCAG (1 = iguals, 21 = blanc sobre negre). */
export function contrastRatio(hexA: string, hexB: string): number {
  if (!isHexColor(hexA) || !isHexColor(hexB)) return 21;
  const a = luminance(hexA);
  const b = luminance(hexB);
  const [light, darkL] = a > b ? [a, b] : [b, a];
  return (light + 0.05) / (darkL + 0.05);
}
