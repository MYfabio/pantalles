"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
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
import Link from "next/link";
import Module from "@/components/panel/Module";
import ScreenDataForm from "@/components/panel/ScreenDataForm";
import PanelDisplay, { isBlockShown, isPosterBlock } from "@/components/PanelDisplay";
import { imageSlotFor, layoutLabel, IMAGE_SLOTS } from "@/lib/panel-layout";
import {
  THEME_PRESETS,
  FONT_SCALES,
  MIN_CONTRAST,
  resolveTheme,
  presetIdFor,
  contrastRatio,
  isHexColor,
} from "@/lib/panel-theme";

const PREVIEW_SCALE = 400 / 1080;
const SCREEN_WIDTH = 1080;
const SCREEN_HEIGHT = 1920;

interface Screen {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  active?: boolean;
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
  themePrimary: string | null;
  themeDark: string | null;
  fontScale: number;
}

type ModuleKey = "capcalera" | "aparenca" | "blocs" | "dades";

function hhmm(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/**
 * L'editor d'una pantalla: el seu contingut, la seva aparença i les seves dades.
 *
 * Cada pantalla té el seu contingut i no es comparteix. Per reaprofitar-ne un
 * es carrega una còpia del d'una altra pantalla, que després s'edita per separat.
 */
export default function ScreenEditor({ screenId }: { screenId: string }) {
  const [panelId, setPanelId] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<EditableBlock[]>([]);
  const [logoUrl, setLogoUrl] = useState("");
  const [showClock, setShowClock] = useState(true);
  const [showWeather, setShowWeather] = useState(true);
  const [showQuote, setShowQuote] = useState(false);
  const [quoteText, setQuoteText] = useState("");
  const [showSustainability, setShowSustainability] = useState(true);
  const [sustainabilityImageUrl, setSustainabilityImageUrl] = useState("");
  const [sustainabilityIndicators, setSustainabilityIndicators] = useState<EditableIndicator[]>([]);
  const [themePrimary, setThemePrimary] = useState<string | null>(null);
  const [themeDark, setThemeDark] = useState<string | null>(null);
  const [fontScale, setFontScale] = useState(1);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copying, setCopying] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSustainabilityImage, setUploadingSustainabilityImage] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  // Only the module being worked on is open; the rest show a one-line summary.
  const [openModules, setOpenModules] = useState<Record<ModuleKey, boolean>>({
    capcalera: false,
    aparenca: false,
    blocs: true,
    dades: false,
  });
  const [openBlockId, setOpenBlockId] = useState<string | null>(null);

  // What was last loaded or saved, so the bar can say whether there is
  // anything unsaved. The snapshot is taken after the state settles (see the
  // effect on cleanTick), not inside the async load, where state is stale.
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);
  const [cleanTick, setCleanTick] = useState(0);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const toggleModule = (key: ModuleKey) =>
    setOpenModules((prev) => ({ ...prev, [key]: !prev[key] }));

  const applyPanel = useCallback((panel: Panel) => {
    setPanelId(panel.id);
    setLogoUrl(panel.logoUrl || "");
    setShowClock(panel.showClock);
    setShowWeather(panel.showWeather);
    setShowQuote(panel.showQuote);
    setQuoteText(panel.quoteText || "");
    setShowSustainability(panel.showSustainability);
    setSustainabilityImageUrl(panel.sustainabilityImageUrl || "");
    setThemePrimary(panel.themePrimary ?? null);
    setThemeDark(panel.themeDark ?? null);
    setFontScale(panel.fontScale ?? 1);
  }, []);

  const loadBlocks = useCallback(async (id: string) => {
    const res = await fetch(`/api/panel-blocks?panelId=${id}`, { cache: "no-store" });
    const data: EditableBlock[] = await res.json();
    setBlocks(data);
    const first = [...data].sort((a, b) => a.order - b.order)[0];
    setOpenBlockId((prev) => (data.some((b) => b.id === prev) ? prev : first?.id ?? null));
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ownRes, screensRes, sustainabilityRes] = await Promise.all([
        fetch(`/api/screens/${screenId}/panel`, { cache: "no-store" }),
        fetch("/api/screens", { cache: "no-store" }),
        fetch("/api/sustainability", { cache: "no-store" }),
      ]);
      const own = await ownRes.json();
      if (!ownRes.ok) throw new Error(own?.error || "Error carregant la pantalla");
      setScreen(own.screen);
      setCanUndo(own.canUndo);
      setScreens(await screensRes.json());
      setSustainabilityIndicators(await sustainabilityRes.json());
      applyPanel(own.panel);
      await loadBlocks(own.panel.id);
      setLoadError(null);
      setCleanTick((t) => t + 1);
    } catch (error: any) {
      setLoadError(error?.message || "Error carregant la pantalla");
    } finally {
      setLoading(false);
    }
  }, [screenId, applyPanel, loadBlocks]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const snapshot = useMemo(
    () =>
      JSON.stringify({
        logoUrl,
        showClock,
        showWeather,
        showQuote,
        quoteText,
        showSustainability,
        sustainabilityImageUrl,
        themePrimary,
        themeDark,
        fontScale,
        blocks,
        sustainabilityIndicators,
      }),
    [
      logoUrl,
      showClock,
      showWeather,
      showQuote,
      quoteText,
      showSustainability,
      sustainabilityImageUrl,
      themePrimary,
      themeDark,
      fontScale,
      blocks,
      sustainabilityIndicators,
    ]
  );

  useEffect(() => {
    if (cleanTick > 0) setSavedSnapshot(snapshot);
    // The snapshot is meant to be read here only when a load or a save asks for it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleanTick]);

  const dirty = savedSnapshot !== null && snapshot !== savedSnapshot;

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const runAction = async (body: Record<string, string>, fallback: string) => {
    setCopying(true);
    try {
      const res = await fetch(`/api/screens/${screenId}/panel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || fallback);
      await loadData();
    } catch (error: any) {
      alert(error?.message || fallback);
    } finally {
      setCopying(false);
    }
  };

  /** Carrega aquí una còpia del que hi ha a una altra pantalla. */
  const handleLoadFrom = async (fromId: string) => {
    const from = screens.find((sc) => sc.id === fromId);
    if (!from) return;
    const unsaved = dirty ? "\n\nTens canvis sense desar en aquesta pantalla: també es perdran." : "";
    if (
      !confirm(
        `Carregar aquí el que hi ha a «${from.name}»?\n\n` +
          `Substituirà el contingut d'aquesta pantalla. El d'ara queda guardat i el pots recuperar amb «Desfés la càrrega».${unsaved}`
      )
    ) {
      return;
    }
    await runAction({ action: "load", fromScreenId: fromId }, "Error carregant el contingut");
  };

  /** Torna al contingut que hi havia abans de l'última càrrega. */
  const handleUndoLoad = async () => {
    if (!confirm("Tornar al contingut que hi havia abans de carregar el d'una altra pantalla?")) return;
    await runAction({ action: "undo" }, "Error desfent la càrrega");
  };

  const updateBlock = (id: string, patch: Partial<EditableBlock>) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const updateIndicator = (id: string, patch: Partial<EditableIndicator>) => {
    setSustainabilityIndicators((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...patch } : i))
    );
  };

  const uploadImage = async (file: File, label: string) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || `Error pujant ${label}`);
    return data.url as string;
  };

  const handleSustainabilityImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSustainabilityImage(true);
    try {
      setSustainabilityImageUrl(await uploadImage(file, "la imatge"));
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
      setLogoUrl(await uploadImage(file, "el logotip"));
    } catch (error: any) {
      alert(error?.message || "Error pujant el logotip");
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
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
              videoUrl: b.videoUrl,
              fullBleed: b.fullBleed,
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
          logoUrl,
          showClock,
          showWeather,
          showQuote,
          quoteText,
          showSustainability,
          sustainabilityImageUrl,
          themePrimary,
          themeDark,
          fontScale,
        }),
      });
      await checkResponse(panelRes, "Configuració del panell");

      setLastSavedAt(new Date());
      setCleanTick((t) => t + 1);
    } catch (error: any) {
      console.error("ERROR SAVING PANEL:", error);
      alert(`Error guardant el panell.\n\n${error?.message || error}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Carregant...</div>;
  if (loadError || !screen) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-700 mb-3">{loadError || "No s'ha trobat la pantalla."}</p>
        <Link href="/dashboard/screens" className="text-sm" style={{ color: "#4a8abf" }}>
          ← Torna a Pantalles
        </Link>
      </div>
    );
  }

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
      videoUrl: b.videoUrl,
      fullBleed: b.fullBleed,
    }));

  // Which blocks the panel will actually draw, in the same terms PanelDisplay
  // uses, so the editor's size advice matches what appears on screen.
  const isShown = (b: EditableBlock) => isBlockShown(b);
  const byOrder = (a: EditableBlock, b: EditableBlock) => a.order - b.order;
  const shownBlocks = blocks.filter(isShown).sort(byOrder);
  // For a block that is not shown yet, advise as if it were switched on.
  const slotFor = (block: EditableBlock) => {
    if (block.fullBleed) return IMAGE_SLOTS.POSTER;
    const list = shownBlocks.includes(block)
      ? shownBlocks
      : [...shownBlocks, block].sort(byOrder);
    return imageSlotFor(list.length, list.indexOf(block), block.key);
  };

  const theme = resolveTheme({ themePrimary, themeDark, fontScale });
  const presetId = presetIdFor({ themePrimary, themeDark, fontScale });
  const inheritsTheme = themePrimary === null;
  const headerContrast = contrastRatio(theme.primary, "#ffffff");
  const lowContrast = headerContrast < MIN_CONTRAST;
  const fontLabel = FONT_SCALES.find((f) => Math.abs(f.value - fontScale) < 0.01)?.label ?? "Personalitzada";

  const previewSettings = {
    logoUrl,
    showClock,
    showWeather,
    showQuote,
    quoteText,
    showSustainability,
    sustainabilityImageUrl,
    theme,
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

  const headerSummary =
    [
      logoUrl && "Logotip",
      showClock && "Rellotge",
      showWeather && "Temps de Sabadell",
      showQuote && "Frase del dia",
      showSustainability && "Sostenibilitat",
    ]
      .filter(Boolean)
      .join(" · ") || "Res activat";
  const appearanceSummary = `${
    inheritsTheme ? "Color del centre" : THEME_PRESETS.find((p) => p.id === presetId)?.label ?? "Color propi"
  } · lletra ${fontLabel.toLowerCase()}`;
  const posterBlock = shownBlocks.find(isPosterBlock);
  const blocksSummary = posterBlock
    ? `Cartell a pantalla completa (${posterBlock.title || "sense títol"})`
    : `${shownBlocks.length} ${shownBlocks.length === 1 ? "actiu" : "actius"} · ${layoutLabel(shownBlocks.length)}`;
  const otherScreens = screens.filter((sc) => sc.id !== screenId);
  const dataSummary = [screen.location, screen.active === false ? "Inactiva" : "Activa"]
    .filter(Boolean)
    .join(" · ");

  const toggleRow = (label: string, checked: boolean, onChange: (v: boolean) => void) => (
    <label className="flex items-center justify-between px-3 py-2 border rounded-lg bg-gray-50 text-sm font-bold cursor-pointer">
      {label}
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/dashboard/screens" className="text-sm" style={{ color: "#4a8abf" }}>
            ← Pantalles
          </Link>
          <h1 className="text-lg font-medium mr-2">
            {screen.name}
            {screen.location && <span className="text-gray-400 font-normal"> · {screen.location}</span>}
          </h1>
          {otherScreens.length > 0 && (
            <select
              aria-label="Carrega el que hi ha a una altra pantalla"
              value=""
              onChange={(e) => e.target.value && handleLoadFrom(e.target.value)}
              disabled={copying}
              className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm bg-white"
              title="Posa aquí una còpia del contingut d'una altra pantalla. Després s'edita per separat."
            >
              <option value="">
                {copying ? "Carregant…" : "Carrega el que hi ha a una altra pantalla…"}
              </option>
              {otherScreens.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.name}
                  {sc.location ? ` · ${sc.location}` : ""}
                </option>
              ))}
            </select>
          )}
          {canUndo && (
            <button
              type="button"
              onClick={handleUndoLoad}
              disabled={copying}
              className="px-3 py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-sm disabled:opacity-60"
              title="Torna al contingut que hi havia abans de l'última càrrega"
            >
              ↩ Desfés la càrrega
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 mr-1"
            role="status"
            aria-live="polite"
          >
            <span
              className={`inline-block w-2 h-2 rounded-full ${dirty ? "bg-amber-500" : "bg-emerald-600"}`}
              aria-hidden="true"
            />
            {dirty
              ? "Canvis sense desar"
              : lastSavedAt
              ? `Desat a les ${hhmm(lastSavedAt)}`
              : "Sense canvis"}
          </span>
          <button
            onClick={() => setFullscreen(true)}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium"
          >
            ⛶ Vista real
          </button>
          <button
            onClick={() => {
              if (!dirty || confirm("Es descartaran els canvis sense desar. Continuar?")) {
                loadData();
              }
            }}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium"
          >
            Restablir
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-60"
            style={{ background: "#a00842" }}
          >
            {saving ? "Guardant..." : "Guardar"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_440px] gap-6 items-start">
        <div className="space-y-3 min-w-0">
          <Module
            title="Capçalera"
            summary={headerSummary}
            open={openModules.capcalera}
            onToggle={() => toggleModule("capcalera")}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
              <div>
                <label className="block text-xs font-bold mb-1">Frase del dia</label>
                <input
                  type="text"
                  value={quoteText}
                  onChange={(e) => setQuoteText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
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
                  className="w-full text-xs"
                />
                {uploadingLogo && <div className="text-xs text-gray-400 mt-1">Pujant logotip...</div>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
              {toggleRow("Mostrar rellotge", showClock, setShowClock)}
              {toggleRow("Mostrar temps de Sabadell", showWeather, setShowWeather)}
              {toggleRow("Mostrar frase del dia", showQuote, setShowQuote)}
              {toggleRow("Mostrar sostenibilitat", showSustainability, setShowSustainability)}
            </div>
          </Module>

          <Module
            title="Aparença"
            summary={appearanceSummary}
            open={openModules.aparenca}
            onToggle={() => toggleModule("aparenca")}
          >
            <div className="flex items-baseline justify-between gap-3 mb-2">
              <label className="text-xs font-bold">Color de la capçalera</label>
              <button
                type="button"
                onClick={() => {
                  setThemePrimary(null);
                  setThemeDark(null);
                }}
                aria-pressed={inheritsTheme}
                className={`text-xs px-2.5 py-1 rounded-full border ${
                  inheritsTheme
                    ? "border-[#e9a7b9] bg-[#fce7ed] text-[#7a1230] font-bold"
                    : "border-gray-300 text-gray-600"
                }`}
              >
                Hereta del centre
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2" role="group" aria-label="Combinacions de colors">
              {THEME_PRESETS.map((p) => {
                const on = presetId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setThemePrimary(p.primary);
                      setThemeDark(p.dark);
                    }}
                    aria-pressed={on}
                    className={`rounded-lg border p-1.5 text-left bg-white ${
                      on ? "border-[#a00842] ring-2 ring-[#fce7ed]" : "border-gray-200"
                    }`}
                  >
                    <span
                      className="block h-7 rounded"
                      style={{ background: `linear-gradient(90deg, ${p.primary} 60%, ${p.dark} 60%)` }}
                      aria-hidden="true"
                    />
                    <span className="block text-[11px] font-semibold mt-1">{p.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 mt-3">
              <div>
                <label className="block text-xs font-bold mb-1">Color propi</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.primary}
                    onChange={(e) => {
                      const v = e.target.value.toLowerCase();
                      if (isHexColor(v)) {
                        setThemePrimary(v);
                        setThemeDark(v);
                      }
                    }}
                    className="h-9 w-12 border border-gray-300 rounded cursor-pointer bg-white"
                    aria-label="Tria un color de capçalera"
                  />
                  <span className="text-sm font-mono text-gray-600">{theme.primary}</span>
                </div>
                {lowContrast && (
                  <p className="text-[11px] text-amber-800 mt-2">
                    Amb aquest color, el text blanc de la capçalera no es llegeix prou bé de lluny
                    (contrast {headerContrast.toFixed(1)}:1, el mínim és {MIN_CONTRAST}:1). Tria&apos;n un de més fosc.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Mida de la lletra dels blocs</label>
                <div className="inline-flex border border-gray-300 rounded-lg overflow-hidden" role="group" aria-label="Mida de lletra">
                  {FONT_SCALES.map((f, i) => {
                    const on = Math.abs(f.value - fontScale) < 0.01;
                    return (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => setFontScale(f.value)}
                        aria-pressed={on}
                        className={`px-3 py-1.5 text-xs font-bold ${i > 0 ? "border-l border-gray-300" : ""} ${
                          on ? "bg-[#1f2a47] text-white" : "bg-white text-gray-600"
                        }`}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-gray-400 mt-2">
                  Per llegir de lluny. Amb la lletra gran hi cap menys text a cada bloc.
                </p>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mt-3">
              Els colors de cada bloc (General, Secretaria, ESO…) no canvien: diuen de quin tipus és
              l&apos;avís i són iguals a tots els panells.
            </p>
          </Module>

          <Module
            title="Blocs"
            summary={blocksSummary}
            open={openModules.blocs}
            onToggle={() => toggleModule("blocs")}
          >
            <div className="flex items-baseline justify-between mb-2 gap-3">
              <span className="text-xs text-gray-500">{layoutLabel(shownBlocks.length)}</span>
              <span className="text-[11px] text-gray-400">
                Arrossega per canviar l&apos;ordre · s&apos;edita un bloc alhora
              </span>
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
                      expanded={openBlockId === block.id}
                      onToggle={() => setOpenBlockId(openBlockId === block.id ? null : block.id)}
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
          </Module>

          <Module
            title="Dades de la pantalla"
            summary={dataSummary}
            open={openModules.dades}
            onToggle={() => toggleModule("dades")}
          >
            <ScreenDataForm
              screenId={screenId}
              onSaved={(saved) => setScreen((prev) => (prev ? { ...prev, ...saved } : prev))}
            />
          </Module>
        </div>

        <div className="xl:sticky xl:top-6 flex flex-col items-center">
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
          <div className="mt-3 text-xs text-gray-500 text-center">
            <a href={`/panel/${screen.slug}`} target="_blank" rel="noreferrer" style={{ color: "#4a8abf" }}>
              Obre la pantalla real ↗
            </a>
            <div className="text-gray-400 mt-1">Les pantalles es refresquen soles cada pocs minuts.</div>
          </div>
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
