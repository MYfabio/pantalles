/**
 * S'executa un cop en arrencar el servidor. Només engega l'informe d'activitat
 * cap a aulaia.cat (si hi ha clau). La comprovació de NEXT_RUNTIME ha d'anar
 * així, dins l'if, perquè el compilador tregui l'import de la versió edge.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { iniciarInformeActivitat } = await import("./lib/activitat");
    iniciarInformeActivitat();
  }
}
