import { prisma } from "@/lib/prisma";
import { defaultBlocksFor } from "@/lib/panel-defaults";

/**
 * Cada pantalla té el seu contingut.
 *
 * Abans un mateix panell es podia mostrar a diverses pantalles, i això feia
 * que un canvi en una es veiés a les altres sense voler. Ara el contingut no
 * es comparteix mai: es copia d'una pantalla a una altra i, a partir d'aquí,
 * cada una s'edita per separat. El model (Panel, PanelBlock) és el mateix;
 * el que canvia és que aquestes funcions garanteixen un panell per pantalla.
 */

/** Còpia completa d'un panell (capçalera, aparença i blocs), sense assignar. */
async function clonePanel(sourceId: string, name: string) {
  const source = await prisma.panel.findUniqueOrThrow({
    where: { id: sourceId },
    include: { blocks: true },
  });
  const panel = await prisma.panel.create({
    data: {
      name,
      logoUrl: source.logoUrl,
      showClock: source.showClock,
      showWeather: source.showWeather,
      showQuote: source.showQuote,
      quoteText: source.quoteText,
      showSustainability: source.showSustainability,
      sustainabilityImageUrl: source.sustainabilityImageUrl,
      themePrimary: source.themePrimary,
      themeDark: source.themeDark,
      fontScale: source.fontScale,
    },
  });
  await prisma.panelBlock.createMany({
    data: source.blocks.map((b) => ({
      panelId: panel.id,
      key: b.key,
      order: b.order,
      enabled: b.enabled,
      title: b.title,
      text: b.text,
      date: b.date,
      typeText: b.typeText,
      imageUrl: b.imageUrl,
      videoUrl: b.videoUrl,
      fullBleed: b.fullBleed,
      startsAt: b.startsAt,
      endsAt: b.endsAt,
    })),
  });
  return panel.id;
}

/**
 * Retorna el panell propi de la pantalla, creant-lo si cal.
 *
 * - Sense contingut: se'n crea un amb els cinc blocs buits.
 * - Contingut compartit amb altres pantalles (dades d'abans del canvi): se'n
 *   fa una còpia per a aquesta. A la pantalla real es continua veient el mateix.
 */
export async function ensureOwnPanel(screenId: string): Promise<string> {
  const screen = await prisma.screen.findUniqueOrThrow({
    where: { id: screenId },
    include: { panel: { include: { screens: { select: { id: true } } } } },
  });

  if (!screen.panel) {
    const panel = await prisma.panel.create({ data: { name: screen.name } });
    await prisma.panelBlock.createMany({ data: defaultBlocksFor(panel.id) });
    await prisma.screen.update({ where: { id: screenId }, data: { panelId: panel.id } });
    return panel.id;
  }

  if (screen.panel.screens.length > 1) {
    const ownId = await clonePanel(screen.panel.id, screen.name);
    await prisma.screen.update({ where: { id: screenId }, data: { panelId: ownId } });
    return ownId;
  }

  return screen.panel.id;
}

/** Esborra un panell de còpia de seguretat si ja no el mostra cap pantalla. */
async function dropIfUnused(panelId: string | null) {
  if (!panelId) return;
  const inUse = await prisma.screen.count({
    where: { OR: [{ panelId }, { previousPanelId: panelId }] },
  });
  if (inUse === 0) {
    await prisma.panel.deleteMany({ where: { id: panelId } });
  }
}

/**
 * Posa a `screenId` una còpia del que hi ha a `fromScreenId`.
 *
 * El que hi havia no s'esborra: queda guardat com a contingut anterior perquè
 * es pugui desfer. Només es guarda l'últim; el d'abans, si n'hi havia, sí que
 * s'esborra.
 */
export async function loadFromScreen(screenId: string, fromScreenId: string) {
  if (screenId === fromScreenId) throw new Error("És la mateixa pantalla");
  const currentId = await ensureOwnPanel(screenId);
  const sourceId = await ensureOwnPanel(fromScreenId);
  const screen = await prisma.screen.findUniqueOrThrow({ where: { id: screenId } });
  const olderBackup = screen.previousPanelId;

  const newId = await clonePanel(sourceId, screen.name);
  await prisma.screen.update({
    where: { id: screenId },
    data: { panelId: newId, previousPanelId: currentId },
  });
  if (olderBackup && olderBackup !== currentId) await dropIfUnused(olderBackup);
  return newId;
}

/** Torna al contingut que la pantalla tenia abans de l'última càrrega. */
export async function undoLoad(screenId: string) {
  const screen = await prisma.screen.findUniqueOrThrow({ where: { id: screenId } });
  if (!screen.previousPanelId) throw new Error("No hi ha res per desfer");
  const previous = await prisma.panel.findUnique({ where: { id: screen.previousPanelId } });
  if (!previous) {
    await prisma.screen.update({ where: { id: screenId }, data: { previousPanelId: null } });
    throw new Error("El contingut anterior ja no existeix");
  }
  const loaded = screen.panelId;
  await prisma.screen.update({
    where: { id: screenId },
    data: { panelId: previous.id, previousPanelId: null },
  });
  await dropIfUnused(loaded);
  return previous.id;
}
