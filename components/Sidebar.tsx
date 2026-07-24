"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const links = [
  { href: "/dashboard", label: "Tauler", icon: "📊" },
  { href: "/dashboard/panel", label: "Panell general", icon: "🗂️" },
  { href: "/dashboard/screens", label: "Pantalles", icon: "🖥️" },
  { href: "/dashboard/users", label: "Usuaris", icon: "👥" },
  { href: "/dashboard/settings", label: "Configuracio", icon: "⚙️" },
  { href: "/dashboard/help", label: "Ajuda / Manual", icon: "❓" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className="h-screen flex flex-col text-white transition-all duration-200"
      style={{ background: "#1a3a5c", width: collapsed ? 64 : 224 }}
    >
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        {!collapsed && (
          <div>
            <h1 className="text-lg font-bold">Escola Industrial</h1>
            <p className="text-xs text-white/60">Gestor de pantalles</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="text-white/70 hover:text-white p-1 rounded hover:bg-white/10"
          title={collapsed ? "Expandir menu" : "Col·lapsar menu"}
          aria-label={collapsed ? "Expandir menu" : "Col·lapsar menu"}
        >
          {collapsed ? "»" : "«"}
        </button>
      </div>

      <nav className="flex-1 py-2">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            title={collapsed ? l.label : undefined}
            className={`flex items-center gap-3 px-4 py-2.5 text-sm ${
              collapsed ? "justify-center" : ""
            } ${pathname === l.href ? "bg-white/10 font-medium" : "text-white/70 hover:bg-white/5"}`}
          >
            <span>{l.icon}</span>
            {!collapsed && l.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-2">
        {!collapsed && session?.user?.name && (
          <div className="text-xs text-white/60 truncate" title={session.user.name}>
            {session.user.name}
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          title="Tancar sessio"
          className={`flex items-center gap-2 text-sm text-white/60 hover:text-white ${
            collapsed ? "justify-center w-full" : ""
          }`}
        >
          <span>🚪</span>
          {!collapsed && "Tancar sessio"}
        </button>
      </div>
    </div>
  );
}
