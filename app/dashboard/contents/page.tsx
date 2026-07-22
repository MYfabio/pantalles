import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ContentsPage() {
  const contents = await prisma.content.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-medium">Continguts</h1>
        <Link href="/dashboard/contents/new" className="px-4 py-2 rounded-lg text-sm text-white font-medium" style={{ background: "#1a3a5c" }}>+ Nou</Link>
      </div>
      <div className="bg-white rounded-xl border">
        {contents.map(c => (
          <div key={c.id} className="flex items-center justify-between px-4 py-3 border-b last:border-0">
            <div className="text-sm">{c.title}</div>
            <span className={"text-xs px-2 py-0.5 rounded " + (c.status === "PUBLISHED" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500")}>{c.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
