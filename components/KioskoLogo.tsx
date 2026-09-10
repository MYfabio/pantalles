/**
 * Kiosko wordmark: a portrait screen (the panels are 1080x1920) on a stand,
 * with three stacked content blocks inside that echo the panel layout. Drawn
 * with currentColor plus one accent so it works on the dark login background
 * and on white.
 */
export function KioskoMark({
  size = 40,
  accent = "#a00842",
}: {
  size?: number;
  accent?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Kiosko"
    >
      <rect
        x="10"
        y="4"
        width="28"
        height="34"
        rx="4"
        stroke="currentColor"
        strokeWidth="3"
      />
      <rect x="15" y="10" width="18" height="4" rx="2" fill={accent} />
      <rect x="15" y="18" width="18" height="3" rx="1.5" fill="currentColor" opacity="0.55" />
      <rect x="15" y="24" width="12" height="3" rx="1.5" fill="currentColor" opacity="0.55" />
      <path d="M24 38v6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M16 44h16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default function KioskoLogo({
  size = 40,
  accent = "#a00842",
  subtitle,
}: {
  size?: number;
  accent?: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <KioskoMark size={size} accent={accent} />
      <div className="leading-tight">
        <div className="text-2xl font-bold tracking-tight">
          Kiosko
          <span style={{ color: accent }}>.</span>
        </div>
        {subtitle && <div className="text-xs opacity-70">{subtitle}</div>}
      </div>
    </div>
  );
}
