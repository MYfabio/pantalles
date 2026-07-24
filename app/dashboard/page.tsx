import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const screens = await prisma.screen.findMany();
  const contents = await prisma.content.findMany({ orderBy: { createdAt: "desc" }, take: 10 });
  const published = contents.filter(c => c.status === "PUBLISHED").length;

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
          <div className="text-xs text-gray-500">Continguts</div>
          <div className="text-2xl font-bold mt-1">{contents.length}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-xs text-gray-500">Publicats</div>
          <div className="text-2xl font-bold mt-1">{published}</div>
        </div>
      </div>
      <h2 className="text-sm font-medium mb-3">Pantalles</h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {screens.map(s => (
          <div key={s.id} className="bg-white rounded-xl border p-4">
            <div className="font-medium">{s.name}</div>
            <div className="text-xs text-gray-400">{s.location}</div>
            <a href={"/display/" + s.slug} target="_blank" className="text-xs mt-2 inline-block" style={{ color: "#4a8abf" }}>Vista publica</a>
          </div>
        ))}
      </div>
      <h2 className="text-sm font-medium mb-3">Continguts recents</h2>
      <div className="bg-white rounded-xl border">
        {contents.map(c => (
          <div key={c.id} className="flex items-center justify-between px-4 py-3 border-b last:border-0">
            <div className="text-sm">{c.title}</div>
            <span className={"text-xs px-2 py-0.5 rounded-full " + (c.status === "PUBLISHED" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500")}>{c.status}</span>
          </div>
        ))}
        {contents.length === 0 && <div className="py-8 text-center text-gray-400 text-sm">Cap contingut</div>}
      </div>
    </div>
  );
}
