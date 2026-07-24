"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function EditScreenPage() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [location, setLocation] = useState("");
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    const fetchScreen = async () => {
      try {
        const res = await fetch(`/api/screens/${id}`);
        const data = await res.json();
        setName(data.name);
        setSlug(data.slug);
        setLocation(data.location || "");
        setActive(data.active);
      } catch (error) {
        alert("Error carregant pantalla");
      } finally {
        setFetching(false);
      }
    };
    fetchScreen();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/screens/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, location, active }),
      });

      if (res.ok) {
        router.push("/dashboard/screens");
      } else {
        alert("Error actualitzant pantalla");
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
        <h1 className="text-lg font-medium">Editar pantalla</h1>
        <Link href="/dashboard/screens" className="text-sm" style={{ color: "#4a8abf" }}>
          ← Tornar
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Slug (URL)</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Ubicació</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              id="active"
            />
            <label htmlFor="active" className="text-sm font-medium">Activa</label>
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
              href="/dashboard/screens"
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