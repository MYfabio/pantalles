"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface Screen {
  id: string;
  name: string;
  location: string | null;
}

export default function EditContentPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [screens, setScreens] = useState<Screen[]>([]);
  const [screenIds, setScreenIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contentRes, screensRes] = await Promise.all([
          fetch(`/api/contents/${id}`),
          fetch("/api/screens"),
        ]);
        const content = await contentRes.json();
        const screensData = await screensRes.json();
        setTitle(content.title);
        setBody(content.body || "");
        setStatus(content.status);
        setScreenIds((content.screens || []).map((s: { screenId: string }) => s.screenId));
        setScreens(screensData);
      } catch (error) {
        alert("Error cargando contenido");
      } finally {
        setFetching(false);
      }
    };

    fetchData();
  }, [id]);

  const toggleScreen = (screenId: string) => {
    setScreenIds((prev) =>
      prev.includes(screenId) ? prev.filter((s) => s !== screenId) : [...prev, screenId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/contents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, status, screenIds }),
      });

      if (res.ok) {
        router.push("/dashboard/contents");
      } else {
        alert("Error actualizado contenido");
      }
    } catch (error) {
      alert("Error: " + error);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-medium">Editar contingut</h1>
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

          <div>
            <label className="block text-sm font-medium mb-1">Pantalles</label>
            <div className="border border-gray-300 rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
              {screens.map((screen) => (
                <label key={screen.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={screenIds.includes(screen.id)}
                    onChange={() => toggleScreen(screen.id)}
                  />
                  {screen.name}
                  {screen.location && <span className="text-gray-400">({screen.location})</span>}
                </label>
              ))}
              {screens.length === 0 && (
                <div className="text-sm text-gray-400">No hi ha pantalles disponibles</div>
              )}
            </div>
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
