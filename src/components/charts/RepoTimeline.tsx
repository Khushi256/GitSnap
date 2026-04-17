import type { GitHubRepo } from "@/lib/github";

export function RepoTimeline({ repos }: { repos: GitHubRepo[] }) {
  const data = repos.filter((r) => !r.fork);
  if (data.length === 0)
    return <p className="text-sm text-muted-foreground">No repos yet.</p>;

  // group by year-month
  const buckets = new Map<string, number>();
  for (const r of data) {
    const k = r.created_at.slice(0, 7); // YYYY-MM
    buckets.set(k, (buckets.get(k) ?? 0) + 1);
  }
  const sorted = [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b));
  const max = Math.max(...sorted.map(([, v]) => v), 1);

  const w = 600;
  const h = 160;
  const pad = 30;
  const stepX = (w - pad * 2) / Math.max(sorted.length - 1, 1);

  const points = sorted.map(([, v], i) => {
    const x = pad + i * stepX;
    const y = h - pad - (v / max) * (h - pad * 2);
    return [x, y] as const;
  });

  const path = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const area =
    `M${points[0][0]},${h - pad} ` +
    points.map(([x, y]) => `L${x},${y}`).join(" ") +
    ` L${points[points.length - 1][0]},${h - pad} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="block w-full">
      <defs>
        <linearGradient id="tlGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.9 0 0)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="oklch(0.9 0 0)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="var(--color-border)" />
      <path d={area} fill="url(#tlGrad)" />
      <path
        d={path}
        fill="none"
        stroke="oklch(0.9 0 0)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2.5} fill="oklch(0.9 0 0)" />
      ))}
      <text x={pad} y={h - 8} fontSize="10" fill="var(--color-muted-foreground)">
        {sorted[0]?.[0]}
      </text>
      <text
        x={w - pad}
        y={h - 8}
        fontSize="10"
        textAnchor="end"
        fill="var(--color-muted-foreground)"
      >
        {sorted[sorted.length - 1]?.[0]}
      </text>
    </svg>
  );
}
