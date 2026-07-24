import { prisma } from "@/lib/prisma";
import GeneratedScreenFrame from "@/components/GeneratedScreenFrame";

export const dynamic = "force-dynamic";

export default async function DisplayPage({ params }: { params: { slug: string } }) {
  const screen = await prisma.screen.findUnique({ where: { slug: params.slug }, include: { contents: { include: { content: true } } } });
  const settings = await prisma.settings.findUnique({ where: { id: "main" } });

  if (!screen) return <div className="w-full h-screen flex items-center justify-center text-white" style={{ background: "#1a3a5c" }}>Pantalla no trobada</div>;

  const published = screen.contents.map(c => c.content).filter(c => c.status === "PUBLISHED");
  const current = published[0];

  if (current?.generatedHtml) {
    return <GeneratedScreenFrame html={current.generatedHtml} />;
  }

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center text-white" style={{ background: settings?.primaryColor || "#1a3a5c" }}>
      <h1 className="text-4xl font-bold mb-4">{screen.name}</h1>
      {current && <div className="text-2xl">{current.title}</div>}
      {!current && <div className="text-xl opacity-50">Cap contingut</div>}
    </div>
  );
}
