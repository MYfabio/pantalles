"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewContentPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch("/api/contents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, status, screenIds: [] }),
      });

      if (res.ok) {
        router.push("/dashboard/contents");
      } else {
        alert("Error creando contenido");
      }
    } catch (error) {
      alert("Error: " + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-medium">Nou contingut</h1>
        <Link href="/dashboard/contents" className="text-sm" style={{ color: "#4a8abf" }}>
          ← Tornar
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Títol</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Contingut</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg h-32"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Estat</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="DRAFT">Esborrany</option>
              <option value="PUBLISHED">Publicat</option>
              <option value="SCHEDULED">Programat</option>
            </select>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg text-white font-medium"
              style={{ background: "#1a3a5c" }}
            >
              {loading ? "Guardant..." : "Guardar"}
            </button>
            <Link
              href="/dashboard/contents"
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600"
            >
              Cancelar
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}