"use client";
import { useEffect, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { COLORS, LABELS } from "@/components/PanelDisplay";
import type { ImageSlot } from "@/lib/panel-layout";
import { VIDEO_MAX_BYTES, VIDEO_MAX_SECONDS, VIDEO_TYPES } from "@/lib/media-limits";

const TYPE_OPTIONS = ["Activitat", "Sortida", "Orientació", "Avís", "Centre", "Empresa"];

// Read at a distance, standing up: past these lengths the text stops being
// scannable on a 1080x1920 panel, so the editor warns instead of letting it through.
// The text limit went from 140 to 240 when line breaks started to count: nine
// classrooms, one per line, are already a hundred characters.
const TITLE_LIMIT = 60;
const TEXT_LIMIT = 240;

const VIDEO_MAX_MB = Math.round(VIDEO_MAX_BYTES / 1024 / 1024);

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
  /** Vídeo curt sense so. Quan n'hi ha, imageUrl és el seu fotograma de reserva. */
  videoUrl: string | null;
  startsAt: string | null;
  endsAt: string | null;
  order: number;
}

type MediaTab = "none" | "image" | "video";

function mediaTabFor(block: EditableBlock): MediaTab {
  if (block.videoUrl) return "video";
  if (block.imageUrl) return "image";
  return "none";
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

/**
 * Llegeix la durada d'un vídeo i en treu un fotograma, al navegador, abans
 * de pujar res. Així el límit de durada es comprova sense que el servidor
 * hagi de descodificar el fitxer, i el fotograma serveix de reserva a les
 * pantalles que no puguin reproduir-lo.
 */
async function inspectVideo(file: File): Promise<{ duration: number; poster: Blob | null }> {
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = url;
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("No s'ha pogut llegir el vídeo. Prova amb un MP4."));
    });
    const duration = video.duration;
    const at = Math.min(1, (isFinite(duration) ? duration : 0) / 2);
    await new Promise<void>((resolve) => {
      video.onseeked = () => resolve();
      video.currentTime = at;
      // Alguns navegadors no disparen "seeked" amb fitxers curts: no ens hi encallem.
      setTimeout(resolve, 3000);
    });
    let poster: Blob | null = null;
    if (video.videoWidth && video.videoHeight) {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")?.drawImage(video, 0, 0);
      poster = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    }
    return { duration, poster };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function SortableBlockEditor({
  block,
  onChange,
  imageSlot,
  expanded,
  onToggle,
}: {
  block: EditableBlock;
  onChange: (id: string, patch: Partial<EditableBlock>) => void;
  /** Shape of this block's image in the current layout; null = no image shown. */
  imageSlot: ImageSlot | null;
  /** Només un bloc s'edita alhora; els altres es veuen com una línia. */
  expanded: boolean;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [improving, setImproving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [tab, setTab] = useState<MediaTab>(() => mediaTabFor(block));

  // Si el mitjà canvia per fora (es carrega el panell, s'esborra), la pestanya segueix.
  useEffect(() => {
    setTab(mediaTabFor(block));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block.imageUrl, block.videoUrl]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const status = windowStatus(block);

  // The natural size of the uploaded image, to warn when its shape is far from
  // the slot's: the panel crops to the centre, so a portrait photo in a wide
  // slot loses its top and bottom.
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    if (!block.imageUrl) {
      setNaturalSize(null);
      return;
    }
    const img = new window.Image();
    img.onload = () => setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => setNaturalSize(null);
    img.src = block.imageUrl;
  }, [block.imageUrl]);

  const ratioMismatch =
    imageSlot && naturalSize
      ? Math.abs(naturalSize.w / naturalSize.h - imageSlot.width / imageSlot.height) /
          (imageSlot.width / imageSlot.height) >
        0.15
      : false;

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
      onChange(block.id, { imageUrl: data.url, videoUrl: null });
    } catch (error: any) {
      alert(error?.message || "Error pujant la imatge");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!VIDEO_TYPES.includes(file.type)) {
      alert("El vídeo ha de ser MP4 o WebM.");
      e.target.value = "";
      return;
    }
    if (file.size > VIDEO_MAX_BYTES) {
      alert(`El vídeo pesa massa: el màxim són ${VIDEO_MAX_MB} MB. Retalla'l o comprimeix-lo.`);
      e.target.value = "";
      return;
    }
    setUploadingVideo(true);
    try {
      const { duration, poster } = await inspectVideo(file);
      if (isFinite(duration) && duration > VIDEO_MAX_SECONDS + 0.5) {
        throw new Error(
          `El vídeo dura ${Math.round(duration)} segons i el màxim són ${VIDEO_MAX_SECONDS}. En una pantalla de passadís, més llarg no es mira.`
        );
      }
      let posterUrl = block.imageUrl || "";
      if (poster) {
        const form = new FormData();
        form.append("file", new File([poster], "fotograma.jpg", { type: "image/jpeg" }));
        const res = await fetch("/api/upload", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Error pujant el fotograma");
        posterUrl = data.url;
      }
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload-video", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error pujant el vídeo");
      onChange(block.id, { videoUrl: data.url, imageUrl: posterUrl });
    } catch (error: any) {
      alert(error?.message || "Error pujant el vídeo");
    } finally {
      setUploadingVideo(false);
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

  const handleGenerateImage = async () => {
    if (!imageSlot) return;
    if (!block.title.trim() && !block.text.trim()) {
      alert("Escriu primer un títol o un text: la imatge es genera a partir d'ells");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: block.title,
          text: block.text,
          ratio: imageSlot.ratio,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error generant la imatge");
      onChange(block.id, { imageUrl: data.url, videoUrl: null });
    } catch (error: any) {
      alert(error?.message || "Error generant la imatge");
    } finally {
      setGenerating(false);
    }
  };

  const applyTemplate = (label: string) => {
    const template = TEMPLATES.find((t) => t.label === label);
    if (!template) return;
    onChange(block.id, { ...template.patch, enabled: true });
  };

  // Canviar de pestanya diu què ha de tenir el bloc: cap mitjà, una imatge o
  // un vídeo. Passar de vídeo a imatge deixa el fotograma com a imatge.
  const selectTab = (next: MediaTab) => {
    setTab(next);
    if (next === "none" && (block.imageUrl || block.videoUrl)) {
      onChange(block.id, { imageUrl: "", videoUrl: null });
    } else if (next === "image" && block.videoUrl) {
      onChange(block.id, { videoUrl: null });
    }
  };

  const titleOver = block.title.length > TITLE_LIMIT;
  const textOver = block.text.length > TEXT_LIMIT;

  const mediaLabel = block.videoUrl ? "vídeo" : block.imageUrl ? "imatge" : "sense mitjà";
  const meta = [block.date, block.typeText, status, mediaLabel].filter(Boolean).join(" · ");

  const tabClass = (t: MediaTab) =>
    `px-3 py-1.5 text-xs font-bold border-b-2 -mb-px ${
      tab === t ? "border-[#a00842] text-[#7a1230]" : "border-transparent text-gray-500"
    }`;

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, borderLeftColor: COLORS[block.key], borderLeftWidth: 6 }}
      className={`border rounded-xl mb-2 bg-white ${expanded ? "border-gray-300" : "border-gray-200"}`}
      data-key={block.key}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab text-gray-400 hover:text-gray-600 px-1 shrink-0"
          title="Arrossega per reordenar"
          aria-label="Arrossega per reordenar"
        >
          ⠿
        </button>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="flex-1 min-w-0 flex items-center gap-3 text-left"
          title={expanded ? "Tanca el bloc" : "Edita el bloc"}
        >
          <span
            className="shrink-0 text-[10px] font-extrabold uppercase tracking-wide text-white px-2 py-0.5 rounded-full"
            style={{ background: COLORS[block.key] }}
          >
            {LABELS[block.key]}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold truncate">
              {block.title || <span className="text-gray-400 font-normal">Sense títol</span>}
            </span>
            {!expanded && <span className="block text-[11px] text-gray-500 truncate">{meta}</span>}
          </span>
          {expanded && block.enabled && status && (
            <span
              className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800"
              title="Activat, però fora de la finestra de publicació"
            >
              {status}
            </span>
          )}
          <span className="text-gray-400 shrink-0" aria-hidden="true">
            {expanded ? "▾" : "▸"}
          </span>
        </button>
        <label className="shrink-0 flex items-center gap-1 text-[11px] text-gray-500" title="Actiu a la pantalla">
          <input
            type="checkbox"
            checked={block.enabled}
            onChange={(e) => onChange(block.id, { enabled: e.target.checked })}
          />
        </label>
      </div>

      {expanded && (
        <div className="px-3 pb-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
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
            className={`w-full px-3 py-2 border rounded-lg text-sm min-h-[84px] ${
              textOver ? "border-red-400" : "border-gray-300"
            }`}
          />
          <div className="text-[10px] text-gray-400 mt-1">
            Cada línia surt en una línia a la pantalla. Si totes comencen amb un guió, es veuen com a llista.
          </div>
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

          <div className="mt-3">
            <label className="block text-xs font-bold mb-1">Mitjà</label>
            <div className="flex gap-1 border-b border-gray-200 mb-2" role="tablist">
              <button type="button" role="tab" aria-selected={tab === "none"} className={tabClass("none")} onClick={() => selectTab("none")}>
                Cap
              </button>
              <button type="button" role="tab" aria-selected={tab === "image"} className={tabClass("image")} onClick={() => selectTab("image")}>
                Imatge
              </button>
              <button type="button" role="tab" aria-selected={tab === "video"} className={tabClass("video")} onClick={() => selectTab("video")}>
                Vídeo
              </button>
            </div>

            {tab === "none" && (
              <div className="text-[11px] text-gray-500">El bloc ocupa tota la targeta amb el títol i el text.</div>
            )}

            {tab === "image" && (
              <>
                {imageSlot ? (
                  <div className="mb-2 p-2 rounded-lg border border-gray-200 bg-gray-50 text-[11px]">
                    <div className="flex items-center justify-between gap-2">
                      <span>
                        Mida ideal ara:{" "}
                        <strong>
                          {imageSlot.width} × {imageSlot.height} px
                        </strong>{" "}
                        <span className="text-gray-400">({imageSlot.ratio})</span>
                      </span>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={handleGenerateImage}
                          disabled={generating}
                          className="px-2 py-1 rounded font-bold text-white disabled:opacity-60"
                          style={{ background: "#a00842" }}
                          title="Genera una imatge a partir del títol i el text, a la mida d'aquest forat"
                        >
                          {generating ? "Generant…" : "✨ Genera amb IA"}
                        </button>
                        <a
                          href={imageSlot.canvaUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 rounded font-bold text-white"
                          style={{ background: "#1a3a5c" }}
                          title={`Plantilla de Canva: ${imageSlot.canvaTitle}`}
                        >
                          Canva ↗
                        </a>
                      </div>
                    </div>
                    {ratioMismatch && naturalSize && (
                      <div className="mt-1.5 text-amber-800">
                        Aquesta imatge és {naturalSize.w} × {naturalSize.h}: no té la mateixa forma i es
                        retallarà pel centre.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mb-2 p-2 rounded-lg border border-gray-200 bg-gray-50 text-[11px] text-gray-500">
                    Amb cinc blocs actius només el bloc General mostra imatge; aquí no es veurà.
                  </div>
                )}
                {block.imageUrl && (
                  <div className="relative mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={block.imageUrl} alt="" className="w-full h-28 object-cover rounded-lg border" />
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

            {tab === "video" && (
              <>
                {!imageSlot && (
                  <div className="mb-2 p-2 rounded-lg border border-gray-200 bg-gray-50 text-[11px] text-gray-500">
                    Amb cinc blocs actius només el bloc General mostra mitjans; aquí no es veurà.
                  </div>
                )}
                {block.videoUrl ? (
                  <div className="relative mb-2">
                    <video
                      src={block.videoUrl}
                      poster={block.imageUrl || undefined}
                      className="w-full h-28 object-cover rounded-lg border bg-black"
                      muted
                      loop
                      playsInline
                      controls
                    />
                    <button
                      type="button"
                      onClick={() => onChange(block.id, { videoUrl: null })}
                      className="absolute top-1.5 right-1.5 bg-white text-red-600 text-xs font-bold px-2 py-1 rounded shadow-md border border-red-200"
                    >
                      🗑️ Treu el vídeo
                    </button>
                  </div>
                ) : (
                  <div className="mb-2 p-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 text-[11px] text-gray-600">
                    <strong className="block text-gray-800">Un clip curt, sense so, en bucle.</strong>
                    MP4 o WebM · màxim {VIDEO_MAX_SECONDS} segons i {VIDEO_MAX_MB} MB. El primer fotograma es
                    guarda com a imatge de reserva per a les pantalles que no el puguin reproduir.
                  </div>
                )}
                <input
                  type="file"
                  accept="video/mp4,video/webm"
                  onChange={handleVideoChange}
                  disabled={uploadingVideo}
                  className="w-full text-xs"
                />
                {uploadingVideo && (
                  <div className="text-xs text-gray-400 mt-1">Llegint el vídeo i pujant-lo…</div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
