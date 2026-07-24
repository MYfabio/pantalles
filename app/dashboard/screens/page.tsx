"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface Screen {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  active: boolean;
}

export default function ScreensPage() {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScreens = async () => {
      try {
        const res = await fetch("/api/screens");
        const data = await res.json();
        setScreens(data);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchScreens();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Estàs segur?")) return;
    try {
      await fetch(`/api/screens/${id}`, { method: "DELETE" });
      setScreens(screens.filter((s) => s.id !== id));
    } catch (error) {
      alert("Error eliminant");
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-medium">Pantalles</h1>
        <Link
          href="/dashboard/screens/new"
          className="px-4 py-2 rounded-lg text-white font-medium"
          style={{ background: "#1a3a5c" }}
        >
          + Nova pantalla
        </Link>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead style={{ background: "#f5f5f5" }}>
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium">Nom</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Slug</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Ubicació</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Estat</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Accions</th>
            </tr>
          </thead>
          <tbody>
            {screens.map((screen) => (
              <tr key={screen.id} className="border-t">
                <td className="px-6 py-3">{screen.name}</td>
                <td className="px-6 py-3 text-sm text-gray-600">/{screen.slug}</td>
                <td className="px-6 py-3 text-sm text-gray-600">{screen.location || "-"}</td>
                <td className="px-6 py-3">
                  <span
                    className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{
                      background: screen.active ? "#d1fae5" : "#f3f4f6",
                      color: screen.active ? "#065f46" : "#6b7280",
                    }}
                  >
                    {screen.active ? "Activa" : "Inactiva"}
                  </span>
                </td>
                <td className="px-6 py-3 text-sm space-x-2">
                  <Link
                    href={`/dashboard/screens/${screen.id}/edit`}
                    className="text-blue-600 hover:underline"
                  >
                    Editar
                  </Link>
                  <button
                    onClick={() => handleDelete(screen.id)}
                    className="text-red-600 hover:underline"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {screens.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No hi ha pantalles. <Link href="/dashboard/screens/new" className="text-blue-600">Crear una</Link>
        </div>
      )}
    </div>
  );
}