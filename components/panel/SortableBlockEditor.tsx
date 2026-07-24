"use client";
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
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
          <strong style={{ color: COLORS[block.key] }}>{LABELS[block.key]}</strong>
        </div>
        <input
          type="checkbox"
          checked={block.enabled}
          onChange={(e) => onChange(block.id, { enabled: e.target.checked })}
        />
      </div>

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
    </div>
  );
}
