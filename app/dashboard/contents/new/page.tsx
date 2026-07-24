"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Screen {
  id: string;
  name: string;
  location: string | null;
}

const DEPARTMENTS = [
  { value: "SECRETARIA", label: "Secretaria" },
  { value: "ESO_BATXILLERAT", label: "ESO / Batxillerat" },
  { value: "FP", label: "FP" },
  { value: "GENERAL", label: "General" },
];

const PREVIEW_SCALE = 300 / 1080;

export default function NewContentPage() {
  const [mode, setMode] = useState<"manual" | "ai">("manual");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [screens, setScreens] = useState<Screen[]>([]);
  const [screenIds, setScreenIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [department, setDepartment] = useState(DEPARTMENTS[0].value);
  const [aiContent, setAiContent] = useState("");
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchScreens = async () => {
      try {
        const res = await fetch("/api/screens");
        const data = await res.json();
        setScreens(data);
      } catch (error) {
        console.error("Error carregant pantalles:", error);
      }
    };
    fetchScreens();
  }, []);

  const toggleScreen = (id: string) => {
    setScreenIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/contents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, status, screenIds }),
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

  const handleGenerate = async () => {
    if (!aiContent.trim()) {
      alert("Escriu el contingut a generar");
      return;
    }
    setGenerating(true);
    setGeneratedHtml("");

    try {
      const res = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ department, content: aiContent }),
      });

      const data = await res.json();
      if (res.ok) {
        setGeneratedHtml(data.html);
      } else {
        alert(data.error || "Error generant la pantalla");
      }
    } catch (error) {
      alert("Error: " + error);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveGenerated = async () => {
    if (!generatedHtml) {
      alert("Genera primer la pantalla");
      return;
    }
    if (!title.trim()) {
      alert("Posa un títol");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/contents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body: aiContent,
          status: "DRAFT",
          department,
          generatedHtml,
          screenIds,
        }),
      });

      if (res.ok) {
        router.push("/dashboard/contents");
      } else {
        alert("Error guardant el contingut");
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

      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setMode("manual")}
          className="px-4 py-2 rounded-lg text-sm font-medium border"
          style={
            mode === "manual"
              ? { background: "#1a3a5c", color: "white", borderColor: "#1a3a5c" }
              : { background: "white", color: "#374151", borderColor: "#d1d5db" }
          }
        >
          Manual
        </button>
        <button
          type="button"
          onClick={() => setMode("ai")}
          className="px-4 py-2 rounded-lg text-sm font-medium border"
          style={
            mode === "ai"
              ? { background: "#1a3a5c", color: "white", borderColor: "#1a3a5c" }
              : { background: "white", color: "#374151", borderColor: "#d1d5db" }
          }
        >
          Generar amb IA
        </button>
      </div>

      <div className="bg-white rounded-xl border p-6 max-w-2xl mb-4">
        <label className="block text-sm font-medium mb-1">Títol</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          required
        />
      </div>

      {mode === "manual" && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 max-w-2xl">
          <div className="space-y-4">
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
      )}

      {mode === "ai" && (
        <div className="bg-white rounded-xl border p-6 max-w-2xl">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Departament</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Contingut (text pla)</label>
              <textarea
                value={aiContent}
                onChange={(e) => setAiContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg h-32"
                placeholder="Escriu aqui la informacio que vols mostrar a la pantalla..."
              />
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

            <div>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className="px-4 py-2 rounded-lg text-white font-medium"
                style={{ background: "#a00842" }}
              >
                {generating ? "Generant..." : "Generar pantalla"}
              </button>
            </div>

            {generatedHtml && (
              <div>
                <label className="block text-sm font-medium mb-2">Previsualitzacio</label>
                <div
                  style={{
                    width: 1080 * PREVIEW_SCALE,
                    height: 1920 * PREVIEW_SCALE,
                    overflow: "hidden",
                    position: "relative",
                    border: "1px solid #d1d5db",
                    borderRadius: 8,
                  }}
                >
                  <iframe
                    srcDoc={generatedHtml}
                    title="Previsualitzacio de la pantalla generada"
                    sandbox=""
                    style={{
                      width: 1080,
                      height: 1920,
                      border: "none",
                      transform: `scale(${PREVIEW_SCALE})`,
                      transformOrigin: "top left",
                    }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={handleSaveGenerated}
                disabled={loading || !generatedHtml}
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
        </div>
      )}
    </div>
  );
}
