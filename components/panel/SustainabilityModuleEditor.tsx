"use client";
import { useState } from "react";

export interface EditableIndicator {
  id: string;
  key: string;
  icon: string;
  unitat: string;
  valorInicial: number;
  increment: number;
  dataInici: string;
  frequencia: string;
  enabled: boolean;
}

const FREQ_OPTIONS = [
  { value: "dia", label: "Cada dia" },
  { value: "setmana", label: "Cada setmana" },
  { value: "mes", label: "Cada mes" },
  { value: "any", label: "Cada any" },
];

const INDICATOR_LABELS: Record<string, string> = {
  aigua: "Aigua",
  reciclatge: "Reciclatge",
  energia: "Energia",
  arbres: "Arbres plantats",
  co2: "CO₂ estalviat",
};

export default function SustainabilityModuleEditor({
  indicators,
  onChangeIndicator,
  imageUrl,
  onImageUpload,
  onImageRemove,
  uploadingImage,
}: {
  indicators: EditableIndicator[];
  onChangeIndicator: (id: string, patch: Partial<EditableIndicator>) => void;
  imageUrl: string;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageRemove: () => void;
  uploadingImage: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className="border border-gray-200 rounded-xl p-3 mb-3 bg-white"
      style={{ borderLeftColor: "#16803c", borderLeftWidth: 6 }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="text-gray-400 hover:text-gray-600 px-1"
            title={collapsed ? "Expandir modul" : "Col·lapsar modul"}
            aria-label={collapsed ? "Expandir modul" : "Col·lapsar modul"}
          >
            {collapsed ? "▸" : "▾"}
          </button>
          <strong style={{ color: "#16803c" }}>🌱 Sostenibilitat</strong>
        </div>
      </div>

      {!collapsed && (
        <>
          <label className="block text-xs font-bold mt-2 mb-1">Imatge</label>
          {imageUrl && (
            <div className="relative mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="" className="w-full h-24 object-cover rounded-lg border" />
              <button
                type="button"
                onClick={onImageRemove}
                className="absolute top-1 right-1 bg-white/90 text-red-600 text-xs font-medium px-2 py-1 rounded"
              >
                Eliminar
              </button>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={onImageUpload}
            disabled={uploadingImage}
            className="w-full text-xs mb-3"
          />
          {uploadingImage && <div className="text-xs text-gray-400 mb-2">Pujant imatge...</div>}

          <div className="space-y-3">
            {indicators.map((ind) => (
              <div key={ind.id} className="border border-gray-100 rounded-lg p-2 bg-gray-50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold">
                    {ind.icon} {INDICATOR_LABELS[ind.key] || ind.key}
                  </span>
                  <input
                    type="checkbox"
                    checked={ind.enabled}
                    onChange={(e) => onChangeIndicator(ind.id, { enabled: e.target.checked })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold mb-1">Valor inicial</label>
                    <input
                      type="number"
                      value={ind.valorInicial}
                      onChange={(e) => onChangeIndicator(ind.id, { valorInicial: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Increment</label>
                    <input
                      type="number"
                      value={ind.increment}
                      onChange={(e) => onChangeIndicator(ind.id, { increment: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Data d&apos;inici</label>
                    <input
                      type="date"
                      value={ind.dataInici}
                      onChange={(e) => onChangeIndicator(ind.id, { dataInici: e.target.value })}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Freqüència</label>
                    <select
                      value={ind.frequencia}
                      onChange={(e) => onChangeIndicator(ind.id, { frequencia: e.target.value })}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"
                    >
                      {FREQ_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold mb-1">Unitat</label>
                    <input
                      type="text"
                      value={ind.unitat}
                      onChange={(e) => onChangeIndicator(ind.id, { unitat: e.target.value })}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
