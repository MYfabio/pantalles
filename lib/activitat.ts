import { prisma } from "./prisma";
import { construirDominis, dominiCentre, hiHaActivitat, horesTancades, type Domini, type FilaActius } from "./activitat-xifres";

/**
 * Informe d'activitat cap a aulaia.cat (docs/informe-activitat.md d'aulaia-cat):
 * cada hora, quantes persones del personal han publicat o editat continguts a
 * Kiosko, per domini del correu. Només recomptes: cap nom ni correu.
 * Sense AULAIA_ACTIVITAT_CLAU no fa res.
 */
const URL_INFORME = process.env.AULAIA_ACTIVITAT_URL || "https://www.aulaia.cat/api/activitat";
const HORA_MS = 3_600_000;

/** Les 0:00 de Catalunya del dia de `inici`. */
export function iniciDia(inici: Date): Date {
  const local = new Date(inici.toLocaleString("en-US", { timeZone: "Europe/Madrid" }));
  const desfasament = local.getTime() - inici.getTime();
  local.setHours(0, 0, 0, 0);
  return new Date(local.getTime() - desfasament);
}

export const CONSULTA_ACTIUS = `
  WITH accions AS (
    SELECT "authorId" AS qui, "createdAt" AS quan FROM "Content" WHERE "createdAt" >= $2 AND "createdAt" < $3
    UNION ALL SELECT "authorId", "updatedAt" FROM "Content" WHERE "updatedAt" >= $2 AND "updatedAt" < $3
  )
  SELECT u.email, (count(DISTINCT a.qui) FILTER (WHERE a.quan >= $1))::int AS hora, count(DISTINCT a.qui)::int AS dia
  FROM accions a JOIN "User" u ON u.id = a.qui
  GROUP BY u.email`;

export async function xifresDeLHora(inici: Date): Promise<Domini[]> {
  const fi = new Date(inici.getTime() + HORA_MS);
  const files = (await prisma.$queryRawUnsafe(CONSULTA_ACTIUS, inici, iniciDia(inici), fi)) as { email: string | null; hora: number; dia: number }[];
  const perDomini = new Map<string, FilaActius>();
  for (const r of files) {
    const domini = dominiCentre(r.email);
    const f = perDomini.get(domini) ?? { domini, actiusHora: 0, actiusDia: 0 };
    f.actiusHora += Number(r.hora);
    f.actiusDia += Number(r.dia);
    perDomini.set(domini, f);
  }
  return construirDominis([...perDomini.values()], []);
}

/** `inici`: inici d'una hora ja tancada. No llança mai. */
export async function enviarInformeActivitat(inici: Date): Promise<string> {
  const clau = process.env.AULAIA_ACTIVITAT_CLAU;
  if (!clau) return "sense-clau";
  try {
    const dominis = await xifresDeLHora(inici);
    if (!hiHaActivitat(dominis)) return "sense-activitat";
    const r = await fetch(URL_INFORME, {
      method: "POST",
      headers: { Authorization: `Bearer ${clau}`, "Content-Type": "application/json" },
      body: JSON.stringify({ versio: 1, app: "kiosko", hora: inici.toISOString(), dominis }),
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) console.warn("Informe d'activitat rebutjat:", r.status);
    return r.ok ? "enviat" : "rebutjat";
  } catch (e) {
    console.warn("Informe d'activitat no enviat:", e instanceof Error ? e.name : "error");
    return "error";
  }
}

let engegat = false;

/** Cada 10 minuts mira les 3 darreres hores tancades. Reenviar una hora la substitueix. */
export function iniciarInformeActivitat() {
  if (engegat || !process.env.AULAIA_ACTIVITAT_CLAU) return;
  engegat = true;
  const fetes = new Set<number>();
  const tic = async () => {
    for (const hora of horesTancades(new Date(), 3)) {
      if (fetes.has(hora.getTime())) continue;
      if ((await enviarInformeActivitat(hora)) !== "error") fetes.add(hora.getTime());
    }
    for (const t of fetes) if (Date.now() - t > 6 * HORA_MS) fetes.delete(t);
  };
  setTimeout(() => void tic(), 60_000).unref?.();
  setInterval(() => void tic(), 10 * 60_000).unref?.();
}
