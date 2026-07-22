import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ScreensPage() {
  const screens = await prisma.screen.findMany();
  return (
    <div className="p-6">
      <h1 className="text-lg font-medium mb-6">Pantalles</h1>
      <div className="bg-white rounded-xl border">
        {screens.map(s => (
          <div key={s.id} className="flex items-center justify-between px-4 py-3 border-b last:border-0">
            <div>
              <div className="font-medium">{s.name}</div>
              <div className="text-xs text-gray-400">{s.location} · {s.slug}</div>
            </div>
            <a href={"/display/" + s.slug} target="_blank" className="text-xs" style={{ color: "#4a8abf" }}>Vista</a>
          </div>
        ))}
      </div>
    </div>
  );
}
