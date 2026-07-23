"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface Content {
  id: string;
  title: string;
  status: string;
  createdAt: string;
}

export default function ContentsPage() {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContents = async () => {
      try {
        const res = await fetch("/api/contents");
        const data = await res.json();
        setContents(data);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContents();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Estàs segur?")) return;

    try {
      await fetch(`/api/contents/${id}`, { method: "DELETE" });
      setContents(contents.filter((c) => c.id !== id));
    } catch (error) {
      alert("Error eliminando");
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-medium">Continguts</h1>
        <Link
          href="/dashboard/contents/new"
          className="px-4 py-2 rounded-lg text-white font-medium"
          style={{ background: "#1a3a5c" }}
        >
          + Nou contingut
        </Link>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead style={{ background: "#f5f5f5" }}>
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium">Títol</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Estat</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Data</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Accions</th>
            </tr>
          </thead>
          <tbody>
            {contents.map((content) => (
              <tr key={content.id} className="border-t">
                <td className="px-6 py-3">{content.title}</td>
                <td className="px-6 py-3">
                  <span className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{
                      background: content.status === "PUBLISHED" ? "#d1fae5" : "#fef3c7",
                      color: content.status === "PUBLISHED" ? "#065f46" : "#92400e",
                    }}
                  >
                    {content.status}
                  </span>
                </td>
                <td className="px-6 py-3 text-sm text-gray-600">
                  {new Date(content.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-3 text-sm space-x-2">
                  <Link
                    href={`/dashboard/contents/${content.id}/edit`}
                    className="text-blue-600 hover:underline"
                  >
                    Editar
                  </Link>
                  <button
                    onClick={() => handleDelete(content.id)}
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

      {contents.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No hay continguts. <Link href="/dashboard/contents/new" className="text-blue-600">Crear uno</Link>
        </div>
      )}
    </div>
  );
}
