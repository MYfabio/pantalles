"use client";
import type { ReactNode } from "react";

/**
 * Un apartat plegable de l'editor de panells.
 *
 * Tancat ocupa una línia i el resum diu què hi ha dins; obert mostra el
 * contingut. L'editor n'apila uns quants a l'esquerra de la previsualització,
 * i només cal obrir el que es toca: abans tot era obert alhora i arribar al
 * segon bloc volia dir desplaçar-se mitja pantalla.
 */
export default function Module({
  title,
  summary,
  open,
  onToggle,
  children,
}: {
  title: string;
  summary?: ReactNode;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="bg-white rounded-xl border border-gray-200">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <span
          className={`text-gray-400 text-lg leading-none transition-transform ${open ? "rotate-90" : ""}`}
          aria-hidden="true"
        >
          ›
        </span>
        <span className="text-base font-medium shrink-0" style={{ color: "#a00842" }}>
          {title}
        </span>
        {summary && (
          <span className="ml-auto text-xs text-gray-500 text-right truncate min-w-0">{summary}</span>
        )}
      </button>
      {open && <div className="px-4 pb-4 pt-3 border-t border-gray-100">{children}</div>}
    </section>
  );
}
