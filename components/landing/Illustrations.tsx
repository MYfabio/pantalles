/**
 * Inline SVG illustrations for the landing page.
 *
 * Drawn rather than photographed on purpose: they have to explain a physical
 * setup (a portrait monitor, a USB stick, an Android box) at any size, print
 * legibly, and load with no external requests.
 */

const NAVY = "#1a3a5c";
const ACCENT = "#a00842";
const PINK = "#e8467f";

/** A portrait screen on its stand, showing the panel layout. */
export function MonitorIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 260" className={className} role="img" aria-label="Monitor vertical">
      <rect x="40" y="8" width="120" height="200" rx="8" fill={NAVY} />
      <rect x="48" y="16" width="104" height="184" rx="4" fill="#fff" />
      {/* header strip */}
      <rect x="48" y="16" width="104" height="34" fill={ACCENT} />
      <circle cx="62" cy="33" r="7" fill="#fff" opacity="0.9" />
      <rect x="112" y="26" width="32" height="6" rx="3" fill="#fff" opacity="0.9" />
      <rect x="120" y="37" width="24" height="4" rx="2" fill="#fff" opacity="0.6" />
      {/* content blocks */}
      <rect x="56" y="58" width="88" height="42" rx="4" fill="#eef2f6" />
      <rect x="62" y="66" width="30" height="5" rx="2.5" fill={PINK} />
      <rect x="62" y="76" width="60" height="6" rx="3" fill={NAVY} />
      <rect x="62" y="87" width="44" height="4" rx="2" fill="#9fb0c0" />

      <rect x="56" y="106" width="88" height="42" rx="4" fill="#eef2f6" />
      <rect x="62" y="114" width="26" height="5" rx="2.5" fill="#1769aa" />
      <rect x="62" y="124" width="66" height="6" rx="3" fill={NAVY} />
      <rect x="62" y="135" width="38" height="4" rx="2" fill="#9fb0c0" />

      <rect x="56" y="154" width="88" height="38" rx="4" fill="#eef2f6" />
      <rect x="62" y="162" width="22" height="5" rx="2.5" fill="#087f6b" />
      <rect x="62" y="172" width="56" height="6" rx="3" fill={NAVY} />
      {/* stand */}
      <rect x="92" y="208" width="16" height="30" fill={NAVY} />
      <rect x="62" y="238" width="76" height="10" rx="5" fill={NAVY} />
    </svg>
  );
}

/** A USB stick, used for the offline install. */
export function UsbIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 120" className={className} role="img" aria-label="Llapis USB">
      <rect x="20" y="40" width="110" height="44" rx="8" fill={NAVY} />
      <rect x="130" y="52" width="42" height="20" rx="3" fill="#b8c4d0" />
      <rect x="138" y="57" width="10" height="4" rx="1" fill="#8c9aa8" />
      <rect x="138" y="64" width="10" height="4" rx="1" fill="#8c9aa8" />
      <rect x="34" y="54" width="52" height="16" rx="3" fill="#fff" opacity="0.16" />
      <circle cx="104" cy="62" r="7" fill={PINK} />
      <text
        x="60"
        y="66"
        fill="#fff"
        fontSize="12"
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
        textAnchor="middle"
      >
        APK
      </text>
    </svg>
  );
}

/** A small Android player box with its cable. */
export function AndroidBoxIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 120" className={className} role="img" aria-label="Reproductor Android">
      <rect x="34" y="34" width="108" height="56" rx="10" fill={NAVY} />
      <circle cx="56" cy="62" r="6" fill={PINK} />
      <rect x="72" y="52" width="52" height="6" rx="3" fill="#fff" opacity="0.5" />
      <rect x="72" y="65" width="34" height="5" rx="2.5" fill="#fff" opacity="0.3" />
      <path
        d="M142 62h22c8 0 8 12 16 12"
        stroke="#b8c4d0"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Numbered step marker. */
export function StepBadge({ n }: { n: number }) {
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
      style={{ background: ACCENT }}
    >
      {n}
    </div>
  );
}
