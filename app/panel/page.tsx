import { prisma } from "@/lib/prisma";
import PanelFullscreenFrame from "@/components/PanelFullscreenFrame";

export const dynamic = "force-dynamic";

export default async function PanelPage() {
  const [blocks, panelSettings] = await Promise.all([
    prisma.panelBlock.findMany({ orderBy: { order: "asc" } }),
    prisma.panelSettings.upsert({ where: { id: "main" }, update: {}, create: {} }),
  ]);

  const blockData = blocks.map((b) => ({
    key: b.key,
    enabled: b.enabled,
    title: b.title,
    text: b.text,
    date: b.date,
    typeText: b.typeText,
  }));

  return (
    <PanelFullscreenFrame
      blocks={blockData}
      settings={{
        logoUrl: panelSettings.logoUrl,
        showClock: panelSettings.showClock,
        showWeather: panelSettings.showWeather,
        showQuote: panelSettings.showQuote,
        quoteText: panelSettings.quoteText,
      }}
    />
  );
}
