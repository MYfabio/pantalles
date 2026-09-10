"use client";
import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { COLORS, LABELS } from "@/components/PanelDisplay";

const TYPE_OPTIONS = ["Activitat", "Sortida", "Orientació", "Avís", "Centre", "Empresa"];

// Read at a distance, standing up: past these lengths the text stops being
// scannable on a 1080x1920 panel, so the editor warns instead of letting it through.
const TITLE_LIMIT = 60;
const TEXT_LIMIT = 140;

// Starting points for the most common notices, so nobody faces a blank block.
const TEMPLATES: { label: string; patch: Partial<EditableBlock> }[] = [
  {
    label: "Avís urgent",
    patch: { typeText: "Avís", title: "Avís important", text: "Descriu aquí l'avís en una frase." },
  },
  {
    label: "Activitat amb data",
    patch: {
      typeText: "Activitat",
      title: "Nom de l'activitat",
      text: "On, a quina hora i per a qui.",
    },
  },
  {
    label: "Sortida",
    patch: {
      typeText: "Sortida",
      title: "Destinació de la sortida",
      text: "Curs, punt de trobada i hora de tornada.",
    },
  },
  {
    label: "Orientació",
    patch: {
      typeText: "Orientació",
      title: "Sessió d'orientació",
      text: "Tema de la sessió i a qui va dirigida.",
    },
  },
];

export interface EditableBlock {
  id: string;
  key: string;
  enabled: boolean;
  title: string;
  text: string;
  date: string;
  typeText: string;
  imageUrl: string | null;
  startsAt: string | null;
  endsAt: string | null;
  order: number;
}

// The API returns full ISO timestamps; the date inputs want YYYY-MM-DD.
function toDateInput(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

/** Why a block is not on screen right now, or null if it is showing. */
function windowStatus(block: EditableBlock): string | null {
  const today = new Date().toISOString().slice(0, 10);
  const from = toDateInput(block.startsAt);
  const to = toDateInput(block.endsAt);
  if (from && today < from) return `Programat pel ${from}`;
  if (to && today > to) return `Caducat el ${to}`;
  return null;
}

export default function SortableBlockEditor({
  block,
  onChange,
}: {
  block: EditableBlock;
  onChange: (id: string, patch: Partial<EditableBlock>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });
  const [collapsed, setCollapsed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [improving, setImproving] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const status = windowStatus(block);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error pujant la imatge");
      onChange(block.id, { imageUrl: data.url });
    } catch (error: any) {
      alert(error?.message || "Error pujant la imatge");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleImprove = async () => {
    if (!block.text.trim()) {
      alert("Escriu primer un text a millorar");
      return;
    }
    setImproving(true);
    try {
      const res = await fetch("/api/improve-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: block.text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error millorant el text");
      onChange(block.id, { text: data.text });
    } catch (error: any) {
      alert(error?.message || "Error millorant el text");
    } finally {
      setImproving(false);
    }
  };

  const applyTemplate = (label: string) => {
    const template = TEMPLATES.find((t) => t.label === label);
    if (!template) return;
    onChange(block.id, { ...template.patch, enabled: true });
  };

  const titleOver = block.title.length > TITLE_LIMIT;
  const textOver = block.text.length > TEXT_LIMIT;

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, borderLeftColor: COLORS[block.key], borderLeftWidth: 6 }}
      className="border border-gray-200 rounded-xl p-3 mb-3 bg-white"
      data-key={block.key}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab text-gray-400 hover:text-gray-600 px-1"
            title="Arrossega per reordenar"
            aria-label="Arrossega per reordenar"
          >
            ⠿
          </button>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="text-gray-400 hover:text-gray-600 px-1"
            title={collapsed ? "Expandir bloc" : "Col·lapsar bloc"}
            aria-label={collapsed ? "Expandir bloc" : "Col·lapsar bloc"}
          >
            {collapsed ? "▸" : "▾"}
          </button>
          <strong style={{ color: COLORS[block.key] }}>{LABELS[block.key]}</strong>
          {block.enabled && status && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800"
              title="Activat, pero fora de la finestra de publicacio"
            >
              {status}
            </span>
          )}
        </div>
        <input
          type="checkbox"
          checked={block.enabled}
          onChange={(e) => onChange(block.id, { enabled: e.target.checked })}
        />
      </div>

      {!collapsed && (
        <>
          <div className="flex items-center justify-between mt-1 mb-2">
            <label className="text-xs font-bold text-gray-500">Plantilla</label>
            <select
              value=""
              onChange={(e) => applyTemplate(e.target.value)}
              className="text-xs px-2 py-1 border border-gray-300 rounded-lg bg-white"
            >
              <option value="">Aplicar plantilla…</option>
              {TEMPLATES.map((t) => (
                <option key={t.label} value={t.label}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold">Títol</label>
            <span className={`text-[10px] ${titleOver ? "text-red-600 font-bold" : "text-gray-400"}`}>
              {block.title.length}/{TITLE_LIMIT}
            </span>
          </div>
          <input
            type="text"
            value={block.title}
            onChange={(e) => onChange(block.id, { title: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg text-sm ${
              titleOver ? "border-red-400" : "border-gray-300"
            }`}
          />

          <div className="flex items-center justify-between mt-2 mb-1">
            <div className="flex items-center gap-2">
              <label className="block text-xs font-bold">Text</label>
              <span className={`text-[10px] ${textOver ? "text-red-600 font-bold" : "text-gray-400"}`}>
                {block.text.length}/{TEXT_LIMIT}
              </span>
            </div>
            <button
              type="button"
              onClick={handleImprove}
              disabled={improving}
              className="text-xs font-medium px-2 py-1 rounded"
              style={{ background: "#a00842", color: "#fff" }}
            >
              {improving ? "Millorant..." : "✨ Millora amb IA"}
            </button>
          </div>
          <textarea
            value={block.text}
            onChange={(e) => onChange(block.id, { text: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg text-sm min-h-[70px] ${
              textOver ? "border-red-400" : "border-gray-300"
            }`}
          />
          {textOver && (
            <div className="text-[10px] text-red-600 mt-1">
              Massa llarg per llegir-lo de lluny. Prova el botó de millora amb IA.
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <label className="block text-xs font-bold mb-1">Data</label>
              <input
                type="text"
                value={block.date}
                onChange={(e) => onChange(block.id, { date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Tipus</label>
              <select
                value={block.typeText}
                onChange={(e) => onChange(block.id, { typeText: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="">— Selecciona —</option>
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 p-2 rounded-lg bg-gray-50 border border-gray-200">
            <div className="text-xs font-bold mb-1">Publicació automàtica</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-gray-500 mb-1">Des de</label>
                <input
                  type="date"
                  value={toDateInput(block.startsAt)}
                  onChange={(e) => onChange(block.id, { startsAt: e.target.value || null })}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-1">Fins a</label>
                <input
                  type="date"
                  value={toDateInput(block.endsAt)}
                  onChange={(e) => onChange(block.id, { endsAt: e.target.value || null })}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"
                />
              </div>
            </div>
            <div className="text-[10px] text-gray-400 mt-1">
              Deixa-ho buit perquè es mostri sempre. Fora d&apos;aquestes dates el bloc desapareix
              de les pantalles tot sol.
            </div>
          </div>

          <label className="block text-xs font-bold mt-3 mb-1">Imatge</label>
          {block.imageUrl && (
            <div className="relative mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={block.imageUrl}
                alt=""
                className="w-full h-28 object-cover rounded-lg border"
              />
              <button
                type="button"
                onClick={() => onChange(block.id, { imageUrl: "" })}
                className="absolute top-1.5 right-1.5 bg-white text-red-600 text-xs font-bold px-2 py-1 rounded shadow-md border border-red-200"
              >
                🗑️ Eliminar
              </button>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={uploading}
            className="w-full text-xs"
          />
          {uploading && <div className="text-xs text-gray-400 mt-1">Pujant imatge...</div>}
        </>
      )}
    </div>
  );
}
