import { prisma } from "@/lib/prisma";
import PanelFullscreenFrame from "@/components/PanelFullscreenFrame";

export const dynamic = "force-dynamic";

export default async function PanelPage({ params }: { params: { slug: string } }) {
  const screen = await prisma.screen.findUnique({ where: { slug: params.slug } });

  if (!screen) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-white" style={{ background: "#1a3a5c" }}>
        Pantalla no trobada
      </div>
    );
  }

  const panelSettings = await prisma.panelSettings.upsert({
    where: { id: "main" },
    update: {},
    create: {},
    include: { screens: true },
  });

  const enabledForScreen = panelSettings.screens.some((s) => s.screenId === screen.id);

  if (!enabledForScreen) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-white" style={{ background: "#1a3a5c" }}>
        El panell general no esta activat per a aquesta pantalla
      </div>
    );
  }

  const blocks = await prisma.panelBlock.findMany({ orderBy: { order: "asc" } });

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
