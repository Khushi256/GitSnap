interface Lang {
  name: string;
  count: number;
  pct: number;
}

const PALETTE = [
  "oklch(0.85 0.15 240)", // Bright Light Blue
  "oklch(0.7 0.18 220)", // Bright Cyan-Blue
  "oklch(0.75 0.15 260)", // Bright Indigo
  "oklch(0.65 0.2 240)", // Vibrant Blue
  "oklch(0.8 0.1 230)", // Soft Bright Blue
  "oklch(0.6 0.18 280)", // Vibrant Violet
  "oklch(0.9 0.05 240)", // Very Light Bright Blue
  "oklch(0.55 0.15 250)", // Deep Bright Indigo
];

export function LanguageDonut({ data }: { data: Lang[] }) {
  const top = data.slice(0, 8);
  if (top.length === 0) {
    return <p className="text-sm text-muted-foreground">No language data.</p>;
  }
  const size = 220;
  const r = 80;
  const stroke = 28;
  const c = 2 * Math.PI * r;

  let offset = 0;
  const segments = top.map((l, i) => {
    const len = l.pct * c;
    const seg = (
      <circle
        key={l.name}
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={PALETTE[i % PALETTE.length]}
        strokeWidth={stroke}
        strokeDasharray={`${len} ${c - len}`}
        strokeDashoffset={-offset}
        style={{
          transition: "stroke-dasharray 0.8s ease, stroke-dashoffset 0.8s ease",
        }}
      />
    );
    offset += len;
    return seg;
  });

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={stroke}
          opacity={0.3}
        />
        {segments}
      </svg>
      <ul className="flex-1 space-y-2 w-full">
        {top.map((l, i) => (
          <li key={l.name} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-sm"
                style={{ background: PALETTE[i % PALETTE.length] }}
              />
              <span className="text-foreground">{l.name}</span>
            </span>
            <span className="font-display text-muted-foreground">{(l.pct * 100).toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
