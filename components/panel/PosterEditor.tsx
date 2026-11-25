"use client";
import { useState } from "react";
import { VIDEO_MAX_BYTES, VIDEO_MAX_SECONDS, VIDEO_TYPES } from "@/lib/media-limits";
import { inspectVideo } from "@/lib/video-inspect";
import { IMAGE_SLOTS } from "@/lib/panel-layout";
import {
  buildPosterPrompt,
  POSTER_WIDTH,
  POSTER_HEIGHT,
  POSTER_DESCRIPTION_MAX,
} from "@/lib/poster-prompt";

/** Un bloc del panell tal com el guarda la base de dades. */
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
  /** La imatge o el vídeo ocupen tota la pantalla sota la capçalera. */
  fullBleed: boolean;
  startsAt: string | null;
  endsAt: string | null;
  order: number;
}

const VIDEO_MAX_MB = Math.round(VIDEO_MAX_BYTES / 1024 / 1024);

async function upload(file: File, endpoint: string, label: string) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(endpoint, { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || `Error pujant ${label}`);
  return data.url as string;
}

/**
 * El contingut de la pantalla: una sola imatge o un vídeo a pantalla completa.
 *
 * Es pot pujar el fitxer o descriure el cartell i que el faci Gemini, amb la
 * mida de la pantalla i el text en català. «Copia el prompt» dona el mateix
 * text per fer-lo a fora i pujar-lo després.
 */
export default function PosterEditor({
  block,
  onChange,
  primary,
  dark,
}: {
  block: EditableBlock;
  onChange: (patch: Partial<EditableBlock>) => void;
  primary: string;
  dark: string;
}) {
  const [busy, setBusy] = useState<null | "image" | "video" | "ai">(null);
  const [description, setDescription] = useState("");
  const [copied, setCopied] = useState(false);

  const hasMedia = Boolean(block.imageUrl || block.videoUrl);
  const prompt = buildPosterPrompt({ description, primary, dark });

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy("image");
    try {
      onChange({ imageUrl: await upload(file, "/api/upload", "la imatge"), videoUrl: null });
    } catch (error: any) {
      alert(error?.message || "Error pujant la imatge");
    } finally {
      setBusy(null);
    }
  };

  const handleVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!VIDEO_TYPES.includes(file.type)) {
      alert("El vídeo ha de ser MP4 o WebM.");
      return;
    }
    if (file.size > VIDEO_MAX_BYTES) {
      alert(`El vídeo pesa massa. El màxim són ${VIDEO_MAX_MB} MB.`);
      return;
    }
    setBusy("video");
    try {
      const { duration, poster } = await inspectVideo(file);
      if (isFinite(duration) && duration > VIDEO_MAX_SECONDS + 0.5) {
        throw new Error(
          `El vídeo dura ${Math.round(duration)} segons i el màxim són ${VIDEO_MAX_SECONDS}.`
        );
      }
      // El fotograma es mostra a les pantalles que no poden reproduir el vídeo.
      const posterUrl = poster
        ? await upload(new File([poster], "fotograma.jpg", { type: "image/jpeg" }), "/api/upload", "el fotograma")
        : null;
      const videoUrl = await upload(file, "/api/upload-video", "el vídeo");
      onChange({ videoUrl, imageUrl: posterUrl });
    } catch (error: any) {
      alert(error?.message || "Error pujant el vídeo");
    } finally {
      setBusy(null);
    }
  };

  const handleGenerate = async () => {
    if (!description.trim()) {
      alert("Escriu primer què vols que surti al cartell.");
      return;
    }
    if (hasMedia && !confirm("Substituirà la imatge o el vídeo d'ara. Continuar?")) return;
    setBusy("ai");
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, primary, dark }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No s'ha pogut generar la imatge");
      onChange({ imageUrl: data.url, videoUrl: null });
    } catch (error: any) {
      alert(error?.message || "No s'ha pogut generar la imatge");
    } finally {
      setBusy(null);
    }
  };

  const handleCopy = async () => {
    if (!description.trim()) {
      alert("Escriu primer què vols que surti al cartell.");
      return;
    }
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("No s'ha pogut copiar. Selecciona el text i copia'l a mà.");
    }
  };

  const fileButton = "px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium bg-white cursor-pointer";

  return (
    <div className="space-y-5">
      {/* Què hi ha ara */}
      <div className="flex gap-4 items-start">
        <div
          className="shrink-0 rounded-lg border bg-gray-50 overflow-hidden flex items-center justify-center"
          style={{ width: 108, height: 160 }}
        >
          {block.videoUrl ? (
            <video src={block.videoUrl} muted loop autoPlay playsInline className="w-full h-full object-cover" />
          ) : block.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={block.imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[11px] text-gray-400 text-center px-2">Encara no hi ha res</span>
          )}
        </div>
        <div className="space-y-2 text-sm">
          <p className="text-gray-600">
            Ocupa tota la pantalla sota la capçalera. Mida ideal:{" "}
            <strong>
              {POSTER_WIDTH} × {POSTER_HEIGHT} px
            </strong>{" "}
            (vertical).
          </p>
          <div className="flex flex-wrap gap-2">
            <label className={fileButton}>
              {busy === "image" ? "Pujant…" : "Puja una imatge"}
              <input type="file" accept="image/*" className="hidden" onChange={handleImage} disabled={!!busy} />
            </label>
            <label className={fileButton}>
              {busy === "video" ? "Pujant…" : "Puja un vídeo"}
              <input
                type="file"
                accept={VIDEO_TYPES.join(",")}
                className="hidden"
                onChange={handleVideo}
                disabled={!!busy}
              />
            </label>
            {hasMedia && (
              <button
                type="button"
                onClick={() => confirm("Treure la imatge o el vídeo d'aquesta pantalla?") && onChange({ imageUrl: null, videoUrl: null })}
                className="px-3 py-2 rounded-lg border border-red-200 text-red-600 text-sm bg-white"
                disabled={!!busy}
              >
                Treu-la
              </button>
            )}
          </div>
          <p className="text-[11px] text-gray-400">
            Vídeo: MP4 o WebM, sense so, màxim {VIDEO_MAX_SECONDS} segons i {VIDEO_MAX_MB} MB.
            {IMAGE_SLOTS.POSTER.canvaUrl && (
              <>
                {" "}
                Per fer-la tu:{" "}
                <a href={IMAGE_SLOTS.POSTER.canvaUrl} target="_blank" rel="noreferrer" style={{ color: "#4a8abf" }}>
                  plantilla de Canva ↗
                </a>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Crear-la amb IA */}
      <div className="border-t pt-4">
        <label htmlFor="poster-desc" className="block text-sm font-bold mb-1">
          O crea-la amb IA
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Explica què vols comunicar, amb les dates i hores. La IA hi afegeix sola la mida de la
          pantalla, els colors i que tot el text vagi en català i es llegeixi de lluny.
        </p>
        <textarea
          id="poster-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, POSTER_DESCRIPTION_MAX))}
          placeholder="Per exemple: Jornada de portes obertes, dissabte 14 de desembre de 10 a 13 h. Visita els tallers de FP."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm min-h-[80px]"
        />
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!!busy}
            className="px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-60"
            style={{ background: "#a00842" }}
          >
            {busy === "ai" ? "Generant… (uns 20 segons)" : "✨ Genera la imatge"}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!!busy}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium bg-white"
            title="Copia el text complet per fer-la a Gemini i pujar-la després"
          >
            {copied ? "Copiat!" : "Copia el prompt"}
          </button>
          <span className="text-[11px] text-gray-400">
            {description.length}/{POSTER_DESCRIPTION_MAX}
          </span>
        </div>
        <p className="text-[11px] text-amber-800 mt-2">
          Revisa el text a la vista prèvia abans de desar: a vegades la IA canvia una lletra o
          s&apos;oblida un accent. Si passa, torna-la a generar.
        </p>
      </div>
    </div>
  );
}
