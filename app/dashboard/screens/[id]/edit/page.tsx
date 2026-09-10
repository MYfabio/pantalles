"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface ScreenUrl {
  label: string;
  url: string;
  seconds: number;
  enabled: boolean;
}

export default function EditScreenPage() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [location, setLocation] = useState("");
  const [active, setActive] = useState(true);
  const [urls, setUrls] = useState<ScreenUrl[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [origin, setOrigin] = useState("");
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    const fetchScreen = async () => {
      try {
        const res = await fetch(`/api/screens/${id}`);
        const data = await res.json();
        setName(data.name);
        setSlug(data.slug);
        setLocation(data.location || "");
        setActive(data.active);
        setUrls(
          (data.urls || []).map((u: any) => ({
            label: u.label,
            url: u.url,
            seconds: u.seconds,
            enabled: u.enabled,
          }))
        );
      } catch (error) {
        alert("Error carregant pantalla");
      } finally {
        setFetching(false);
      }
    };
    fetchScreen();
  }, [id]);

  const updateUrl = (index: number, patch: Partial<ScreenUrl>) => {
    setUrls((prev) => prev.map((u, i) => (i === index ? { ...u, ...patch } : u)));
  };

  const move = (index: number, delta: number) => {
    setUrls((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const addUrl = (preset?: Partial<ScreenUrl>) => {
    setUrls((prev) => [
      ...prev,
      { label: "", url: "", seconds: 30, enabled: true, ...preset },
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/screens/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, location, active, urls }),
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

  if (fetching) return <div className="p-6">Carregant...</div>;

  const playlistUrl = `${origin}/api/playlist/${slug}`;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-medium">Editar pantalla</h1>
        <Link href="/dashboard/screens" className="text-sm" style={{ color: "#4a8abf" }}>
          ← Tornar
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <div className="bg-white rounded-xl border p-6 space-y-4">
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
        </div>

        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-base font-medium mb-1" style={{ color: "#a00842" }}>
            Rotació de continguts
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            El que va passant en aquesta pantalla, en ordre. Pots barrejar el panell de Kiosko
            amb qualsevol altra web (Aula Sostenible, Kikup…). Si ho deixes buit, la pantalla
            mostra només el seu panell.
          </p>

          <div className="space-y-3">
            {urls.map((u, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={u.enabled}
                    onChange={(e) => updateUrl(i, { enabled: e.target.checked })}
                    title="Activa a la rotació"
                  />
                  <input
                    type="text"
                    value={u.label}
                    onChange={(e) => updateUrl(i, { label: e.target.value })}
                    placeholder="Nom (p. ex. Aula Sostenible)"
                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={5}
                      value={u.seconds}
                      onChange={(e) => updateUrl(i, { seconds: Number(e.target.value) })}
                      className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                    />
                    <span className="text-xs text-gray-400">s</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="px-2 py-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                    title="Pujar"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === urls.length - 1}
                    className="px-2 py-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                    title="Baixar"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrls((prev) => prev.filter((_, j) => j !== i))}
                    className="px-2 py-1 text-red-500 hover:text-red-700"
                    title="Eliminar"
                  >
                    ✕
                  </button>
                </div>
                <input
                  type="url"
                  value={u.url}
                  onChange={(e) => updateUrl(i, { url: e.target.value })}
                  placeholder="https://…"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm font-mono"
                />
              </div>
            ))}
            {urls.length === 0 && (
              <div className="text-sm text-gray-400">Cap contingut a la rotació</div>
            )}
          </div>

          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={() => addUrl()}
              className="px-3 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm"
            >
              + Afegir URL
            </button>
            <button
              type="button"
              onClick={() =>
                addUrl({ label: "Panell", url: `${origin}/panel/${slug}`, seconds: 60 })
              }
              className="px-3 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm"
            >
              + Afegir el panell
            </button>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-200">
            <div className="text-xs font-bold mb-1">Per configurar el dispositiu</div>
            <p className="text-xs text-gray-500 mb-2">
              L&apos;app de la pantalla només necessita aquesta adreça: llegeix d&apos;aquí què
              ha de mostrar i cada quant, i es va rellegint sola.
            </p>
            <code className="block text-xs font-mono bg-white border rounded px-2 py-1.5 break-all">
              {playlistUrl}
            </code>
          </div>
        </div>

        <div className="flex gap-2">
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
      </form>
    </div>
  );
}
