/**
 * S'executa un cop en arrencar el servidor. Només engega l'informe d'activitat
 * cap a aulaia.cat (si hi ha clau); no fa res al navegador ni a l'edge.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || !process.env.AULAIA_ACTIVITAT_CLAU) return;
  const { iniciarInformeActivitat } = await import("./lib/activitat");
  iniciarInformeActivitat();
}
