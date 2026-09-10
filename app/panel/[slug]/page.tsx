import { prisma } from "@/lib/prisma";
import PanelFullscreenFrame from "@/components/PanelFullscreenFrame";

export const dynamic = "force-dynamic";

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="w-full h-screen flex items-center justify-center text-white"
      style={{ background: "#1a3a5c" }}
    >
      {children}
    </div>
  );
}

export default async function PanelPage({ params }: { params: { slug: string } }) {
  const screen = await prisma.screen.findUnique({
    where: { slug: params.slug },
    include: { panel: { include: { blocks: { orderBy: { order: "asc" } } } } },
  });

  if (!screen) {
    return <Notice>Pantalla no trobada</Notice>;
  }

  if (!screen.panel) {
    return <Notice>Aquesta pantalla no te cap panell assignat</Notice>;
  }

  const panel = screen.panel;
  const sustainabilityIndicators = await prisma.sustainabilityIndicator.findMany({
    orderBy: { order: "asc" },
  });

  // Blocks outside their publication window simply do not reach the screen.
  const now = new Date();
  const blockData = panel.blocks
    .filter((b) => (!b.startsAt || b.startsAt <= now) && (!b.endsAt || b.endsAt >= now))
    .map((b) => ({
      key: b.key,
      enabled: b.enabled,
      title: b.title,
      text: b.text,
      date: b.date,
      typeText: b.typeText,
      imageUrl: b.imageUrl,
    }));

  const indicatorData = sustainabilityIndicators.map((i) => ({
    key: i.key,
    icon: i.icon,
    unitat: i.unitat,
    valorInicial: i.valorInicial,
    increment: i.increment,
    dataInici: i.dataInici,
    frequencia: i.frequencia,
    enabled: i.enabled,
  }));

  return (
    <PanelFullscreenFrame
      blocks={blockData}
      sustainabilityIndicators={indicatorData}
      settings={{
        logoUrl: panel.logoUrl,
        showClock: panel.showClock,
        showWeather: panel.showWeather,
        showQuote: panel.showQuote,
        quoteText: panel.quoteText,
        showSustainability: panel.showSustainability,
        sustainabilityImageUrl: panel.sustainabilityImageUrl,
      }}
    />
  );
}
