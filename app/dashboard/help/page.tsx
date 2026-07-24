"use client";
import { useState, useEffect } from "react";

interface Screen {
  id: string;
  name: string;
  slug: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      alert("No s'ha pogut copiar");
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="px-3 py-1.5 rounded-lg text-xs font-medium text-white shrink-0"
      style={{ background: copied ? "#16803c" : "#1a3a5c" }}
    >
      {copied ? "Copiat!" : "Copiar"}
    </button>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="flex items-start gap-2 bg-gray-900 rounded-lg p-3 my-2">
      <code className="flex-1 text-gray-100 text-xs font-mono whitespace-pre-wrap break-all">
        {code}
      </code>
      <CopyButton text={code} />
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border p-5 mb-4">
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
          style={{ background: "#a00842" }}
        >
          {n}
        </div>
        <h3 className="text-base font-medium">{title}</h3>
      </div>
      <div className="text-sm text-gray-700 leading-relaxed pl-10">{children}</div>
    </div>
  );
}

export default function HelpPage() {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    const fetchScreens = async () => {
      try {
        const res = await fetch("/api/screens");
        const data = await res.json();
        setScreens(data);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchScreens();
  }, []);

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-lg font-medium mb-6">Ajuda / Manual</h1>

      <div className="bg-white rounded-xl border p-5 mb-6">
        <h2 className="text-base font-medium mb-3" style={{ color: "#a00842" }}>
          Pantalles disponibles
        </h2>
        <p className="text-sm text-gray-600 mb-3">
          Aquestes son les URLs publiques de cada pantalla, llestes per copiar i fer servir al Pas 2
          del manual.
        </p>

        {loading && <div className="text-sm text-gray-400">Cargando...</div>}

        {!loading && screens.length === 0 && (
          <div className="text-sm text-gray-400">
            Encara no hi ha cap pantalla creada a Screens.
          </div>
        )}

        <div className="space-y-2">
          {screens.map((screen) => {
            const url = `${origin}/panel/${screen.slug}`;
            return (
              <div
                key={screen.id}
                className="flex items-center justify-between gap-3 px-3 py-2 border rounded-lg bg-gray-50"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium">{screen.name}</div>
                  <div className="text-xs text-gray-500 truncate">{url}</div>
                </div>
                <CopyButton text={url} />
              </div>
            );
          })}
        </div>
      </div>

      <h2 className="text-base font-medium mb-1" style={{ color: "#a00842" }}>
        Configurar un PC per mostrar una pantalla automaticament
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Segueix aquests passos per deixar un PC amb Chrome obrint la pantalla sola en encendre's.
      </p>

      <Step n={1} title="Instal·lar Google Chrome (si no el tens)">
        Descarrega'l des de{" "}
        <span className="font-medium">google.com/chrome</span> i instal·la'l normalment.
      </Step>

      <Step n={2} title="Crear l'accés directe de la pantalla">
        <ol className="list-decimal ml-5 space-y-1">
          <li>Fes clic dret a l&apos;escriptori → Nou → Accés directe</li>
          <li>
            A la casella &quot;Ubicació de l&apos;element&quot;, enganxa això (canvia{" "}
            <span className="font-mono font-medium">AQUI_LA_URL</span> per la URL real de la
            pantalla, agafa-la de la llista de dalt):
          </li>
        </ol>
        <CodeBlock code='"C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk --incognito AQUI_LA_URL' />
        <ol className="list-decimal ml-5 space-y-1" start={3}>
          <li>
            Clica Següent, posa un nom (per exemple &quot;Pantalla Entrada&quot;), i Finalitzar
          </li>
        </ol>
      </Step>

      <Step n={3} title="Fer que s'obri sol en encendre el PC">
        <ol className="list-decimal ml-5 space-y-1">
          <li>Prem Windows + R</li>
          <li>
            Escriu <span className="font-mono font-medium">shell:startup</span> i prem Enter
            (s&apos;obrira una carpeta)
          </li>
          <li>Copia l&apos;acces directe que has creat al Pas 2 dins d&apos;aquesta carpeta</li>
        </ol>
      </Step>

      <Step n={4} title="Configurar el PC perque s'engegui sol (opcional, recomanat)">
        <ol className="list-decimal ml-5 space-y-1">
          <li>Ves a la BIOS/UEFI del PC (normalment prement Supr o F2 en engegar)</li>
          <li>Busca l&apos;opcio &quot;Power On After Power Failure&quot; o similar</li>
          <li>Posa-la en Enabled</li>
        </ol>
      </Step>

      <Step n={5} title="Provar-ho">
        <ol className="list-decimal ml-5 space-y-1">
          <li>Reinicia el PC</li>
          <li>Hauria d&apos;obrir Chrome automaticament, a pantalla completa, sense barres ni botons</li>
        </ol>
      </Step>

      <div
        className="rounded-xl border p-4 mb-3 text-sm"
        style={{ background: "#fef3c7", borderColor: "#fde68a", color: "#92400e" }}
      >
        <strong>Nota important:</strong> cada pantalla fisica necessita el seu propi acces directe
        amb la seva URL corresponent (<span className="font-mono">/panel/entrada</span>,{" "}
        <span className="font-mono">/panel/taller</span>, etc.), segons les pantalles ja creades a
        Screens.
      </div>

      <div className="rounded-xl border p-4 text-sm bg-gray-50">
        <strong>Per sortir del mode kiosk (manteniment):</strong> prem{" "}
        <span className="font-mono font-medium">Alt + F4</span>.
      </div>
    </div>
  );
}
