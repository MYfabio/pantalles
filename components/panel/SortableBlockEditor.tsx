"use client";
import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { COLORS, LABELS } from "@/components/PanelDisplay";

export interface EditableBlock {
  id: string;
  key: string;
  enabled: boolean;
  title: string;
  text: string;
  date: string;
  typeText: string;
  imageUrl: string | null;
  order: number;
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

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
        </div>
        <input
          type="checkbox"
          checked={block.enabled}
          onChange={(e) => onChange(block.id, { enabled: e.target.checked })}
        />
      </div>

      {!collapsed && (
        <>
          <label className="block text-xs font-bold mt-2 mb-1">Títol</label>
          <input
            type="text"
            value={block.title}
            onChange={(e) => onChange(block.id, { title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />

          <label className="block text-xs font-bold mt-2 mb-1">Text</label>
          <textarea
            value={block.text}
            onChange={(e) => onChange(block.id, { text: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm min-h-[70px]"
          />

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
              <input
                type="text"
                value={block.typeText}
                onChange={(e) => onChange(block.id, { typeText: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <label className="block text-xs font-bold mt-2 mb-1">Imatge</label>
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
                className="absolute top-1 right-1 bg-white/90 text-red-600 text-xs font-medium px-2 py-1 rounded"
              >
                Eliminar
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
