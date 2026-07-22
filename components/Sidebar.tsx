"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const links = [
  { href: "/dashboard", label: "Tauler", icon: "📊" },
  { href: "/dashboard/screens", label: "Pantalles", icon: "🖥️" },
  { href: "/dashboard/contents", label: "Continguts", icon: "📝" },
  { href: "/dashboard/users", label: "Usuaris", icon: "👥" },
  { href: "/dashboard/settings", label: "Configuracio", icon: "⚙️" },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <div className="w-56 h-screen flex flex-col text-white" style={{ background: "#1a3a5c" }}>
      <div className="p-4 border-b border-white/10">
        <h1 className="text-lg font-bold">Escola Industrial</h1>
        <p className="text-xs text-white/60">Gestor de pantalles</p>
      </div>
      <nav className="flex-1 py-2">
        {links.map(l => (
          <Link key={l.href} href={l.href} className={`flex items-center gap-3 px-4 py-2.5 text-sm ${pathname === l.href ? "bg-white/10 font-medium" : "text-white/70 hover:bg-white/5"}`}>
            <span>{l.icon}</span>{l.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-white/10">
        <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-sm text-white/60 hover:text-white">Tancar sessio</button>
      </div>
    </div>
  );
}
