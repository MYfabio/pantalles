import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await prisma.settings.findUnique({ where: { id: "main" } });
  return (
    <div className="p-6">
      <h1 className="text-lg font-medium mb-6">Configuracio</h1>
      <div className="bg-white rounded-xl border p-6 max-w-md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom escola</label>
            <div className="text-sm text-gray-600">{settings?.schoolName}</div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Color principal</label>
            <div className="w-8 h-8 rounded border" style={{ background: settings?.primaryColor }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
