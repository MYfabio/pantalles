"use client";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [schoolName, setSchoolName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#1a3a5c");
  const [secondaryColor, setSecondaryColor] = useState("#4a8abf");
  const [accentColor, setAccentColor] = useState("#6aadde");
  const [logoUrl, setLogoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        setSchoolName(data.schoolName || "");
        setPrimaryColor(data.primaryColor || "#1a3a5c");
        setSecondaryColor(data.secondaryColor || "#4a8abf");
        setAccentColor(data.accentColor || "#6aadde");
        setLogoUrl(data.logoUrl || "");
      } catch (error) {
        alert("Error carregant la configuracio");
      } finally {
        setFetching(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolName, primaryColor, secondaryColor, accentColor, logoUrl }),
      });

      if (res.ok) {
        alert("Configuracio guardada");
      } else {
        alert("Error guardant la configuracio");
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
      <h1 className="text-lg font-medium mb-6">Configuracio</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 max-w-md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom escola</label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Color principal</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-10 h-10 border rounded"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Color secundari</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-10 h-10 border rounded"
              />
              <input
                type="text"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Color d&apos;accent</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-10 h-10 border rounded"
              />
              <input
                type="text"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">URL del logotip</label>
            <input
              type="text"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg text-white font-medium"
              style={{ background: "#1a3a5c" }}
            >
              {loading ? "Guardant..." : "Guardar"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
