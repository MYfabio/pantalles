/**
 * Informe d'activitat cap a aulaia.cat (docs/informe-activitat.md d'aulaia-cat).
 * Aquí només hi ha el càlcul pur: de recomptes per domini a cos del missatge.
 * Mai hi va cap nom, correu ni identificador de persona: només xifres.
 */
export const MINIM = 3;

// Comptes personals: no són d'un centre, compten a «altres».
const PERSONALS = new Set(["gmail.com", "googlemail.com", "hotmail.com", "hotmail.es", "outlook.com", "outlook.es", "live.com", "yahoo.com", "yahoo.es", "icloud.com", "me.com", "protonmail.com", "proton.me"]);

export function dominiCentre(correu: string | null | undefined): string {
  const t = String(correu ?? "").trim().toLowerCase();
  const d = t.slice(t.lastIndexOf("@") + 1);
  if (!t.includes("@") || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(d) || PERSONALS.has(d)) return "altres";
  return d;
}

export type FilaActius = { domini: string; actiusHora: number; actiusDia: number };
export type FilaIA = { domini: string; model: string; entrada: number; sortida: number };
export type Domini = { domini: string; actiusHora: number; actiusDia: number; ia?: { model: string; entrada: number; sortida: number }[] };

const MODEL_VALID = /^[a-z0-9._:/-]{1,80}$/;

/**
 * Junta actius i tokens per domini i passa a «altres» els dominis amb menys de
 * 3 persones actives en tot el dia, perquè la xifra no assenyali ningú.
 */
export function construirDominis(actius: FilaActius[], ia: FilaIA[]): Domini[] {
  const mapa = new Map<string, { actiusHora: number; actiusDia: number; ia: Map<string, { entrada: number; sortida: number }> }>();
  const fila = (d: string) => {
    if (!mapa.has(d)) mapa.set(d, { actiusHora: 0, actiusDia: 0, ia: new Map() });
    return mapa.get(d)!;
  };
  const destinacio = new Map<string, string>();
  for (const a of actius) destinacio.set(a.domini, a.domini !== "altres" && a.actiusDia < MINIM ? "altres" : a.domini);
  const desti = (d: string) => destinacio.get(d) ?? "altres"; // tokens sense ningú actiu: a «altres»

  for (const a of actius) {
    const f = fila(desti(a.domini));
    f.actiusHora += a.actiusHora;
    f.actiusDia += a.actiusDia;
  }
  for (const t of ia) {
    const model = t.model.toLowerCase();
    if (!MODEL_VALID.test(model) || (t.entrada <= 0 && t.sortida <= 0)) continue;
    const m = fila(desti(t.domini)).ia;
    const ant = m.get(model) ?? { entrada: 0, sortida: 0 };
    m.set(model, { entrada: ant.entrada + Math.max(0, Math.round(t.entrada)), sortida: ant.sortida + Math.max(0, Math.round(t.sortida)) });
  }
  return [...mapa.entries()].map(([domini, f]) => {
    const iaLlista = [...f.ia.entries()].slice(0, 12).map(([model, v]) => ({ model, ...v }));
    return { domini, actiusHora: f.actiusHora, actiusDia: Math.max(f.actiusDia, f.actiusHora), ...(iaLlista.length ? { ia: iaLlista } : {}) };
  });
}

export function hiHaActivitat(dominis: Domini[]): boolean {
  return dominis.some((d) => d.actiusHora > 0 || (d.ia?.length ?? 0) > 0);
}

/** Inici de l'hora en punt (UTC) que conté `data`. */
export function iniciHora(data: Date): Date {
  const d = new Date(data);
  d.setUTCMinutes(0, 0, 0);
  return d;
}

/** Les darreres `n` hores ja tancades, de la més antiga a la més recent. */
export function horesTancades(ara: Date, n: number): Date[] {
  const actual = iniciHora(ara).getTime();
  return Array.from({ length: n }, (_, i) => new Date(actual - (n - i) * 3_600_000));
}
