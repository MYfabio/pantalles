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
import SustainabilityModuleEditor, {
  EditableIndicator,
} from "@/components/panel/SustainabilityModuleEditor";
import PanelDisplay from "@/components/PanelDisplay";
import { imageSlotFor, layoutLabel } from "@/lib/panel-layout";

const PREVIEW_SCALE = 400 / 1080;
const SCREEN_WIDTH = 1080;
const SCREEN_HEIGHT = 1920;

interface Screen {
  id: string;
  name: string;
  slug: string;
  location: string | null;
}

interface Panel {
  id: string;
  name: string;
  logoUrl: string | null;
  showClock: boolean;
  showWeather: boolean;
  showQuote: boolean;
  quoteText: string | null;
  showSustainability: boolean;
  sustainabilityImageUrl: string | null;
  screenIds: string[];
}

export default function PanelEditorPage() {
  const [panels, setPanels] = useState<Panel[]>([]);
  const [panelId, setPanelId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [blocks, setBlocks] = useState<EditableBlock[]>([]);
  const [logoUrl, setLogoUrl] = useState("");
  const [showClock, setShowClock] = useState(true);
  const [showWeather, setShowWeather] = useState(true);
  const [showQuote, setShowQuote] = useState(false);
  const [quoteText, setQuoteText] = useState("");
  const [showSustainability, setShowSustainability] = useState(true);
  const [sustainabilityImageUrl, setSustainabilityImageUrl] = useState("");
  const [sustainabilityIndicators, setSustainabilityIndicators] = useState<EditableIndicator[]>([]);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [screenIds, setScreenIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSustainabilityImage, setUploadingSustainabilityImage] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const applyPanel = useCallback((panel: Panel) => {
    setPanelId(panel.id);
    setName(panel.name);
    setLogoUrl(panel.logoUrl || "");
    setShowClock(panel.showClock);
    setShowWeather(panel.showWeather);
    setShowQuote(panel.showQuote);
    setQuoteText(panel.quoteText || "");
    setShowSustainability(panel.showSustainability);
    setSustainabilityImageUrl(panel.sustainabilityImageUrl || "");
    setScreenIds(panel.screenIds || []);
  }, []);

  const loadBlocks = useCallback(async (id: string) => {
    const res = await fetch(`/api/panel-blocks?panelId=${id}`, { cache: "no-store" });
    setBlocks(await res.json());
  }, []);

  const loadData = useCallback(
    async (preferredPanelId?: string) => {
      setLoading(true);
      try {
        const [panelsRes, screensRes, sustainabilityRes] = await Promise.all([
          fetch("/api/panels", { cache: "no-store" }),
          fetch("/api/screens", { cache: "no-store" }),
          fetch("/api/sustainability", { cache: "no-store" }),
        ]);
        const panelsData: Panel[] = await panelsRes.json();
        setPanels(panelsData);
        setScreens(await screensRes.json());
        setSustainabilityIndicators(await sustainabilityRes.json());

        const chosen =
          panelsData.find((p) => p.id === preferredPanelId) ||
          panelsData.find((p) => p.id === panelId) ||
          panelsData[0];
        if (chosen) {
          applyPanel(chosen);
          await loadBlocks(chosen.id);
        }
      } catch (error) {
        alert("Error carregant el panell");
      } finally {
        setLoading(false);
      }
    },
    // panelId is read as a fallback only; re-creating this on every switch would
    // reload the whole page for nothing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [applyPanel, loadBlocks]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const switchPanel = async (id: string) => {
    const panel = panels.find((p) => p.id === id);
    if (!panel) return;
    setLoading(true);
    try {
      applyPanel(panel);
      await loadBlocks(id);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePanel = async () => {
    const newName = prompt("Nom del nou panell (per exemple: Panell Taller)");
    if (!newName?.trim()) return;
    const copy = confirm(
      "Vols copiar el contingut del panell actual?\n\nAcceptar: copia blocs i capçalera.\nCancel·lar: crea el panell buit."
    );
    try {
      const res = await fetch("/api/panels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), copyFromId: copy ? panelId : null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error creant el panell");
      await loadData(data.id);
    } catch (error: any) {
      alert(error?.message || "Error creant el panell");
    }
  };

  const handleDeletePanel = async () => {
    if (!panelId) return;
    if (!confirm(`Segur que vols esborrar el panell "${name}"? No es pot desfer.`)) return;
    try {
      const res = await fetch(`/api/panels/${panelId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Error esborrant el panell");
      setPanelId(null);
      await loadData();
    } catch (error: any) {
      alert(error?.message || "Error esborrant el panell");
    }
  };

  const updateBlock = (id: string, patch: Partial<EditableBlock>) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const updateIndicator = (id: string, patch: Partial<EditableIndicator>) => {
    setSustainabilityIndicators((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...patch } : i))
    );
  };

  const handleSustainabilityImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSustainabilityImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error pujant la imatge");
      setSustainabilityImageUrl(data.url);
    } catch (error: any) {
      alert(error?.message || "Error pujant la imatge");
    } finally {
      setUploadingSustainabilityImage(false);
      e.target.value = "";
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error pujant el logotip");
      setLogoUrl(data.url);
    } catch (error: any) {
      alert(error?.message || "Error pujant el logotip");
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
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
    if (!panelId) return;
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
              startsAt: b.startsAt,
              endsAt: b.endsAt,
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

      await Promise.all(
        sustainabilityIndicators.map((ind) =>
          fetch(`/api/sustainability/${ind.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              enabled: ind.enabled,
              icon: ind.icon,
              unitat: ind.unitat,
              valorInicial: ind.valorInicial,
              increment: ind.increment,
              dataInici: ind.dataInici,
              frequencia: ind.frequencia,
            }),
          }).then((res) => checkResponse(res, `Indicador "${ind.key}"`))
        )
      );

      const panelRes = await fetch(`/api/panels/${panelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          logoUrl,
          showClock,
          showWeather,
          showQuote,
          quoteText,
          showSustainability,
          sustainabilityImageUrl,
          screenIds,
        }),
      });
      await checkResponse(panelRes, "Configuracio del panell");

      // Screen assignments are exclusive, so other panels may have changed too.
      const panelsRes = await fetch("/api/panels", { cache: "no-store" });
      setPanels(await panelsRes.json());

      alert("Panell guardat");
    } catch (error: any) {
      console.error("ERROR SAVING PANEL:", error);
      alert(`Error guardant el panell.\n\n${error?.message || error}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Carregant...</div>;

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

  // Which blocks the panel will actually draw, in the same terms PanelDisplay
  // uses, so the editor's size advice matches what appears on screen.
  const isShown = (b: EditableBlock) => b.enabled && !!(b.title || b.text || b.date || b.typeText);
  const byOrder = (a: EditableBlock, b: EditableBlock) => a.order - b.order;
  const shownBlocks = blocks.filter(isShown).sort(byOrder);
  // For a block that is not shown yet, advise as if it were switched on.
  const slotFor = (block: EditableBlock) => {
    const list = shownBlocks.includes(block)
      ? shownBlocks
      : [...shownBlocks, block].sort(byOrder);
    return imageSlotFor(list.length, list.indexOf(block), block.key);
  };

  const previewSettings = {
    logoUrl,
    showClock,
    showWeather,
    showQuote,
    quoteText,
    showSustainability,
    sustainabilityImageUrl,
  };

  // Editing at 400px wide says nothing about whether a text reads from the
  // corridor, so the preview can take over the whole viewport.
  if (fullscreen) {
    return (
      <FullscreenPreview onClose={() => setFullscreen(false)}>
        <PanelDisplay
          blocks={previewBlocks}
          sustainabilityIndicators={sustainabilityIndicators}
          settings={previewSettings}
        />
      </FullscreenPreview>
    );
  }

  const assignedScreens = screens.filter((s) => screenIds.includes(s.id));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <select
            value={panelId || ""}
            onChange={(e) => switchPanel(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white font-medium"
          >
            {panels.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleCreatePanel}
            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm"
            title="Crear un panell nou"
          >
            + Nou
          </button>
          {panels.length > 1 && (
            <button
              onClick={handleDeletePanel}
              className="px-3 py-2 rounded-lg border border-red-200 text-red-600 text-sm"
              title="Esborrar aquest panell"
            >
              Esborrar
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFullscreen(true)}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium"
          >
            ⛶ Vista real
          </button>
          <button
            onClick={() => loadData(panelId || undefined)}
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

            <label className="block text-xs font-bold mb-1">Nom del panell</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3"
            />

            <label className="block text-xs font-bold mb-1">Logotip de la capçalera</label>
            {logoUrl && (
              <div className="relative mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoUrl}
                  alt=""
                  className="w-full h-20 object-contain bg-gray-50 rounded-lg border"
                />
                <button
                  type="button"
                  onClick={() => setLogoUrl("")}
                  className="absolute top-1.5 right-1.5 bg-white text-red-600 text-xs font-bold px-2 py-1 rounded shadow-md border border-red-200"
                >
                  🗑️ Eliminar
                </button>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              disabled={uploadingLogo}
              className="w-full text-xs mb-2"
            />
            {uploadingLogo && <div className="text-xs text-gray-400 mb-3">Pujant logotip...</div>}

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
            <div className="flex items-center justify-between px-3 py-2 border rounded-lg bg-gray-50 mb-2">
              <span className="text-sm font-bold">Mostrar frase del dia</span>
              <input type="checkbox" checked={showQuote} onChange={(e) => setShowQuote(e.target.checked)} />
            </div>
            <div className="flex items-center justify-between px-3 py-2 border rounded-lg bg-gray-50 mb-3">
              <span className="text-sm font-bold">Mostrar sostenibilitat</span>
              <input
                type="checkbox"
                checked={showSustainability}
                onChange={(e) => setShowSustainability(e.target.checked)}
              />
            </div>

            <label className="block text-xs font-bold mb-1">Frase del dia</label>
            <input
              type="text"
              value={quoteText}
              onChange={(e) => setQuoteText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-base font-medium" style={{ color: "#a00842" }}>
              Blocs informatius
            </h2>
            <span className="text-[11px] text-gray-400">{layoutLabel(shownBlocks.length)}</span>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={blocks.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              {blocks
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((block) => (
                  <SortableBlockEditor
                    key={block.id}
                    block={block}
                    onChange={updateBlock}
                    imageSlot={slotFor(block)}
                  />
                ))}
            </SortableContext>
          </DndContext>

          <SustainabilityModuleEditor
            indicators={sustainabilityIndicators}
            onChangeIndicator={updateIndicator}
            imageUrl={sustainabilityImageUrl}
            onImageUpload={handleSustainabilityImageUpload}
            onImageRemove={() => setSustainabilityImageUrl("")}
            uploadingImage={uploadingSustainabilityImage}
          />

          <div className="bg-white rounded-xl border p-4 mt-4">
            <h2 className="text-base font-medium mb-1" style={{ color: "#a00842" }}>
              Pantalles on es mostra
            </h2>
            <p className="text-xs text-gray-400 mb-3">
              Cada pantalla mostra un sol panell: si la marques aquí, deixa de mostrar el que tenia.
            </p>
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

        <div className="flex flex-col items-center">
          <div
            style={{
              width: SCREEN_WIDTH * PREVIEW_SCALE,
              height: SCREEN_HEIGHT * PREVIEW_SCALE,
              overflow: "hidden",
              boxShadow: "0 18px 50px rgba(0,0,0,.25)",
            }}
          >
            <div style={{ transform: `scale(${PREVIEW_SCALE})`, transformOrigin: "top left" }}>
              <PanelDisplay
                blocks={previewBlocks}
                sustainabilityIndicators={sustainabilityIndicators}
                settings={previewSettings}
              />
            </div>
          </div>
          {assignedScreens.length > 0 && (
            <div className="mt-3 text-xs text-gray-500 text-center">
              Es veu a:{" "}
              {assignedScreens.map((s, i) => (
                <span key={s.id}>
                  {i > 0 && ", "}
                  <a
                    href={`/panel/${s.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#4a8abf" }}
                  >
                    {s.name}
                  </a>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Scales the 1080x1920 panel to fill the browser window, like the real screen. */
function FullscreenPreview({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  const [scale, setScale] = useState(0.3);

  useEffect(() => {
    const update = () =>
      setScale(Math.min(window.innerWidth / SCREEN_WIDTH, window.innerHeight / SCREEN_HEIGHT));
    update();
    window.addEventListener("resize", update);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 px-4 py-2 rounded-lg bg-white/90 text-sm font-medium"
      >
        ✕ Tancar (Esc)
      </button>
      <div style={{ transform: `scale(${scale})` }}>{children}</div>
    </div>
  );
}
