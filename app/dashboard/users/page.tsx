import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const users = await prisma.user.findMany();
  return (
    <div className="p-6">
      <h1 className="text-lg font-medium mb-6">Usuaris</h1>
      <div className="bg-white rounded-xl border">
        {users.map(u => (
          <div key={u.id} className="flex items-center justify-between px-4 py-3 border-b last:border-0">
            <div>
              <div className="font-medium">{u.name}</div>
              <div className="text-xs text-gray-400">{u.email}</div>
            </div>
            <span className="text-xs px-2 py-1 rounded" style={{ background: u.role === "ADMIN" ? "#fee2e2" : "#eff6ff", color: u.role === "ADMIN" ? "#991b1b" : "#1e40af" }}>{u.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
