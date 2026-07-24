"use client";
import { useEffect, useState } from "react";

export const COLORS: Record<string, string> = {
  general: "#a00842",
  secretaria: "#7b1e48",
  eso: "#1769aa",
  batx: "#6a4c93",
  fp: "#087f6b",
};
export const LABELS: Record<string, string> = {
  general: "General",
  secretaria: "Secretaria",
  eso: "ESO",
  batx: "Batxillerat",
  fp: "FP",
};
const ICONS: Record<string, string> = {
  general: "📢",
  secretaria: "📄",
  eso: "📚",
  batx: "🎓",
  fp: "⚙️",
};

const WEATHER_CODES: Record<number, string> = {
  0: "☀️ Cel serè",
  1: "🌤️ Poc ennuvolat",
  2: "⛅ Parcialment ennuvolat",
  3: "☁️ Ennuvolat",
  45: "🌫️ Boira",
  61: "🌦️ Pluja feble",
  63: "🌧️ Pluja",
  80: "🌦️ Ruixats",
  95: "⛈️ Tempesta",
};

export interface PanelBlockData {
  key: string;
  enabled: boolean;
  title: string;
  text: string;
  date: string;
  typeText: string;
}

export interface PanelSettingsData {
  logoUrl?: string | null;
  showClock: boolean;
  showWeather: boolean;
  showQuote: boolean;
  quoteText?: string | null;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function PanelDisplay({
  blocks,
  settings,
}: {
  blocks: PanelBlockData[];
  settings: PanelSettingsData;
}) {
  const [now, setNow] = useState<Date | null>(null);
  const [weather, setWeather] = useState("Carregant temps...");

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=41.5433&longitude=2.1094&current=temperature_2m,weather_code&timezone=Europe%2FMadrid"
        );
        const data = await res.json();
        if (cancelled) return;
        const code = data.current.weather_code;
        const temp = Math.round(data.current.temperature_2m);
        setWeather(`${temp} °C · ${WEATHER_CODES[code] || "🌡️ Temps actual"}`);
      } catch {
        if (!cancelled) setWeather("Temps no disponible");
      }
    };
    fetchWeather();
    const id = setInterval(fetchWeather, 900000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const clockText = now ? `${pad(now.getHours())}:${pad(now.getMinutes())}` : "--:--";
  const dateText = now
    ? new Intl.DateTimeFormat("ca-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(now)
    : "Carregant...";

  const active = blocks.filter((b) => b.enabled && (b.title || b.text || b.date || b.typeText));
  const count = active.length || 1;
  const columns = count === 1 ? 1 : 2;
  let rows = "1fr";
  if (count === 3) rows = "1fr 1fr";
  else if (count >= 4) rows = "repeat(3,1fr)";

  return (
    <div className="panel-screen">
      <header className="panel-top">
        <div className="panel-logo-area">
          {settings.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logoUrl} alt="Logotip del centre" />
          ) : (
            <div className="panel-logo-placeholder">EI</div>
          )}
        </div>
        <div className="panel-status">
          <div className="panel-clock" style={{ display: settings.showClock ? "block" : "none" }}>
            {clockText}
          </div>
          <div className="panel-date" style={{ display: settings.showClock ? "block" : "none" }}>
            {dateText}
          </div>
          <div className="panel-weather" style={{ display: settings.showWeather ? "block" : "none" }}>
            {weather}
          </div>
        </div>
        {settings.showQuote && settings.quoteText && (
          <div className="panel-quote">&quot;{settings.quoteText}&quot;</div>
        )}
      </header>

      <section
        className="panel-content"
        style={{ gridTemplateColumns: `repeat(${columns},1fr)`, gridTemplateRows: rows }}
      >
        {active.length === 0 ? (
          <div className="panel-empty">Activa o omple almenys un bloc.</div>
        ) : (
          active.map((item, index) => {
            const spanFull = (count === 3 && index === 0) || (count === 5 && item.key === "general");
            const cardStyle = {
              ["--accent" as string]: COLORS[item.key],
              ...(spanFull ? { gridColumn: "1 / -1" } : {}),
            } as React.CSSProperties;
            return (
              <article key={item.key} className="panel-card" style={cardStyle}>
                <div>
                  <div className="panel-card-head">
                    <span className="panel-badge">{LABELS[item.key]}</span>
                    <span className="panel-icon">{ICONS[item.key]}</span>
                  </div>
                  {item.title && <h3>{item.title}</h3>}
                  {item.text && <p>{item.text}</p>}
                </div>
                <div className="panel-meta">
                  {item.date ? <span className="panel-date-pill">{item.date}</span> : <span />}
                  {item.typeText && <span className="panel-type">{item.typeText}</span>}
                </div>
              </article>
            );
          })
        )}
      </section>
      <footer className="panel-bottom" />

      <style jsx>{`
        .panel-screen {
          width: 1080px;
          height: 1920px;
          background: #fff;
          display: grid;
          grid-template-rows: auto 1fr 12px;
          overflow: hidden;
          font-family: Arial, Helvetica, sans-serif;
          color: #222;
        }
        .panel-top {
          background: #a00842;
          color: #fff;
          padding: 36px 44px;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 36px;
          align-items: center;
        }
        .panel-logo-area {
          min-width: 180px;
          min-height: 104px;
          display: flex;
          align-items: center;
        }
        .panel-logo-area img {
          max-width: 300px;
          max-height: 120px;
          object-fit: contain;
        }
        .panel-logo-placeholder {
          width: 124px;
          height: 124px;
          border: 4px solid #fff;
          border-radius: 20px;
          display: grid;
          place-items: center;
          font-size: 36px;
          font-weight: 800;
        }
        .panel-status {
          text-align: right;
        }
        .panel-clock {
          font-size: 68px;
          font-weight: 800;
          line-height: 1;
        }
        .panel-date {
          font-size: 24px;
          margin-top: 8px;
          text-transform: capitalize;
        }
        .panel-weather {
          font-size: 28px;
          margin-top: 14px;
          font-weight: 700;
        }
        .panel-quote {
          grid-column: 1 / -1;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 2px solid rgba(255, 255, 255, 0.3);
          font-size: 26px;
          font-style: italic;
          text-align: center;
        }
        .panel-content {
          min-height: 0;
          padding: 32px;
          display: grid;
          gap: 20px;
          background: linear-gradient(135deg, rgba(160, 8, 66, 0.045) 0 14%, transparent 14%);
        }
        .panel-empty {
          grid-column: 1 / -1;
          display: grid;
          place-items: center;
          color: #777;
          font-size: 36px;
        }
        .panel-card {
          position: relative;
          border: 1px solid #dedede;
          border-radius: 24px;
          background: #fff;
          padding: 26px 28px 24px 36px;
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 0;
        }
        .panel-card::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 12px;
          background: var(--accent);
        }
        .panel-card-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }
        .panel-icon {
          font-size: 32px;
        }
        .panel-badge {
          background: var(--accent);
          color: #fff;
          border-radius: 999px;
          padding: 8px 16px;
          font-size: 20px;
          font-weight: 800;
          text-transform: uppercase;
        }
        .panel-card h3 {
          margin: 18px 0 10px;
          font-size: 36px;
          line-height: 1.08;
        }
        .panel-card p {
          margin: 0;
          font-size: 26px;
          line-height: 1.28;
          color: #444;
        }
        .panel-meta {
          margin-top: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }
        .panel-date-pill {
          background: #d9d9d9;
          border-radius: 14px;
          padding: 10px 18px;
          font-size: 28px;
          font-weight: 700;
          white-space: nowrap;
        }
        .panel-type {
          color: var(--accent);
          font-size: 24px;
          font-weight: 800;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .panel-bottom {
          background: #a00842;
        }
      `}</style>
    </div>
  );
}
