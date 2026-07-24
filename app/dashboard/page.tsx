import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const screens = await prisma.screen.findMany();
  const blocks = await prisma.panelBlock.findMany({ orderBy: { order: "asc" } });
  const activeBlocks = blocks.filter((b) => b.enabled).length;
  const panelSettings = await prisma.panelSettings.upsert({
    where: { id: "main" },
    update: {},
    create: {},
    include: { screens: true },
  });
  const screensWithPanel = panelSettings.screens.length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-medium text-gray-900">Tauler principal</h1>
        <Link href="/dashboard/panel" className="px-4 py-2 rounded-lg text-sm text-white font-medium" style={{ background: "#1a3a5c" }}>Panell general</Link>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <div className="text-xs text-gray-500">Pantalles</div>
          <div className="text-2xl font-bold mt-1">{screens.length}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-xs text-gray-500">Blocs actius del panell</div>
          <div className="text-2xl font-bold mt-1">{activeBlocks} / {blocks.length}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-xs text-gray-500">Pantalles amb panell actiu</div>
          <div className="text-2xl font-bold mt-1">{screensWithPanel}</div>
        </div>
      </div>
      <h2 className="text-sm font-medium mb-3">Pantalles</h2>
      <div className="grid grid-cols-2 gap-3">
        {screens.map(s => (
          <div key={s.id} className="bg-white rounded-xl border p-4">
            <div className="font-medium">{s.name}</div>
            <div className="text-xs text-gray-400">{s.location}</div>
            <a href={"/panel/" + s.slug} target="_blank" className="text-xs mt-2 inline-block" style={{ color: "#4a8abf" }}>Vista publica</a>
          </div>
        ))}
      </div>
    </div>
  );
}
