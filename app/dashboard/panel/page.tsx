"use client";
import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import SortableBlockEditor, { EditableBlock } from "@/components/panel/SortableBlockEditor";
import PanelDisplay from "@/components/PanelDisplay";

const PREVIEW_SCALE = 400 / 1080;

interface Screen {
  id: string;
  name: string;
  slug: string;
  location: string | null;
}

export default function PanelEditorPage() {
  const [blocks, setBlocks] = useState<EditableBlock[]>([]);
  const [logoUrl, setLogoUrl] = useState("");
  const [showClock, setShowClock] = useState(true);
  const [showWeather, setShowWeather] = useState(true);
  const [showQuote, setShowQuote] = useState(false);
  const [quoteText, setQuoteText] = useState("");
  const [screens, setScreens] = useState<Screen[]>([]);
  const [screenIds, setScreenIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [blocksRes, settingsRes, screensRes] = await Promise.all([
        fetch("/api/panel-blocks", { cache: "no-store" }),
        fetch("/api/settings", { cache: "no-store" }),
        fetch("/api/screens", { cache: "no-store" }),
      ]);
      const blocksData = await blocksRes.json();
      const settingsData = await settingsRes.json();
      const screensData = await screensRes.json();
      setBlocks(blocksData);
      setLogoUrl(settingsData.panel?.logoUrl || "");
      setShowClock(settingsData.panel?.showClock ?? true);
      setShowWeather(settingsData.panel?.showWeather ?? true);
      setShowQuote(settingsData.panel?.showQuote ?? false);
      setQuoteText(settingsData.panel?.quoteText || "");
      setScreens(screensData);
      setScreenIds(settingsData.panel?.screenIds || []);
    } catch (error) {
      alert("Error carregant el panell");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateBlock = (id: string, patch: Partial<EditableBlock>) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const toggleScreen = (id: string) => {
    setScreenIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setBlocks((prev) => {
      const oldIndex = prev.findIndex((b) => b.id === active.id);
      const newIndex = prev.findIndex((b) => b.id === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex);
      return reordered.map((b, index) => ({ ...b, order: index }));
    });
  };

  const checkResponse = async (res: Response, label: string) => {
    if (!res.ok) {
      let detail = "";
      try {
        const data = await res.json();
        detail = data?.error || JSON.stringify(data);
      } catch {
        detail = await res.text().catch(() => "");
      }
      throw new Error(`${label} ha fallat (${res.status}): ${detail}`);
    }
    return res;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all(
        blocks.map((b) =>
          fetch(`/api/panel-blocks/${b.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              enabled: b.enabled,
              title: b.title,
              text: b.text,
              date: b.date,
              typeText: b.typeText,
              imageUrl: b.imageUrl,
            }),
          }).then((res) => checkResponse(res, `Bloc "${b.key}"`))
        )
      );

      const orderRes = await fetch("/api/panel-blocks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks: blocks.map((b) => ({ id: b.id, order: b.order })) }),
      });
      await checkResponse(orderRes, "Ordre dels blocs");

      const settingsRes = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          panel: { logoUrl, showClock, showWeather, showQuote, quoteText, screenIds },
        }),
      });
      await checkResponse(settingsRes, "Configuracio del panell");

      alert("Panell guardat");
    } catch (error: any) {
      console.error("ERROR SAVING PANEL:", error);
      alert(`Error guardant el panell.\n\n${error?.message || error}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  const previewBlocks = [...blocks]
    .sort((a, b) => a.order - b.order)
    .map((b) => ({
      key: b.key,
      enabled: b.enabled,
      title: b.title,
      text: b.text,
      date: b.date,
      typeText: b.typeText,
      imageUrl: b.imageUrl,
    }));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-medium">Panell general</h1>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium"
          >
            Restablir
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-white text-sm font-medium"
            style={{ background: "#1a3a5c" }}
          >
            {saving ? "Guardant..." : "Guardar"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        <div>
          <div className="bg-white rounded-xl border p-4 mb-4">
            <h2 className="text-base font-medium mb-3" style={{ color: "#a00842" }}>
              Capçalera
            </h2>

            <label className="block text-xs font-bold mb-1">URL del logotip</label>
            <input
              type="text"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://.../logo.svg"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3"
            />

            <div className="flex items-center justify-between px-3 py-2 border rounded-lg bg-gray-50 mb-2">
              <span className="text-sm font-bold">Mostrar rellotge</span>
              <input type="checkbox" checked={showClock} onChange={(e) => setShowClock(e.target.checked)} />
            </div>
            <div className="flex items-center justify-between px-3 py-2 border rounded-lg bg-gray-50 mb-2">
              <span className="text-sm font-bold">Mostrar temps de Sabadell</span>
              <input
                type="checkbox"
                checked={showWeather}
                onChange={(e) => setShowWeather(e.target.checked)}
              />
            </div>
            <div className="flex items-center justify-between px-3 py-2 border rounded-lg bg-gray-50 mb-3">
              <span className="text-sm font-bold">Mostrar frase del dia</span>
              <input type="checkbox" checked={showQuote} onChange={(e) => setShowQuote(e.target.checked)} />
            </div>

            <label className="block text-xs font-bold mb-1">Frase del dia</label>
            <input
              type="text"
              value={quoteText}
              onChange={(e) => setQuoteText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <h2 className="text-base font-medium mb-3" style={{ color: "#a00842" }}>
            Blocs informatius
          </h2>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={blocks.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              {blocks
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((block) => (
                  <SortableBlockEditor key={block.id} block={block} onChange={updateBlock} />
                ))}
            </SortableContext>
          </DndContext>

          <div className="bg-white rounded-xl border p-4 mt-4">
            <h2 className="text-base font-medium mb-3" style={{ color: "#a00842" }}>
              Pantalles on es mostra
            </h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
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
        </div>

        <div className="flex justify-center items-start">
          <div
            style={{
              width: 1080 * PREVIEW_SCALE,
              height: 1920 * PREVIEW_SCALE,
              overflow: "hidden",
              boxShadow: "0 18px 50px rgba(0,0,0,.25)",
            }}
          >
            <div style={{ transform: `scale(${PREVIEW_SCALE})`, transformOrigin: "top left" }}>
              <PanelDisplay
                blocks={previewBlocks}
                settings={{ logoUrl, showClock, showWeather, showQuote, quoteText }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
