import type { GitHubRepo } from "@/lib/github";
import { useState } from "react";

export function RepoScatter({ repos }: { repos: GitHubRepo[] }) {
  const [hover, setHover] = useState<GitHubRepo | null>(null);
  const data = repos.filter((r) => !r.fork && r.size > 0);
  if (data.length === 0) return <p className="text-sm text-muted-foreground">Not enough data.</p>;

  const w = 600;
  const h = 260;
  const pad = 36;

  const maxSize = Math.max(...data.map((r) => r.size));
  const maxStars = Math.max(...data.map((r) => r.stargazers_count), 1);

  // log scale for size
  const xScale = (s: number) => pad + (Math.log10(s + 1) / Math.log10(maxSize + 1)) * (w - pad * 2);
  const yScale = (s: number) =>
    h - pad - (Math.log10(s + 1) / Math.log10(maxStars + 1)) * (h - pad * 2);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${w} ${h}`} className="block w-full">
        {/* axes */}
        <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="var(--color-border)" />
        <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="var(--color-border)" />
        <text
          x={w - pad}
          y={h - 10}
          textAnchor="end"
          fontSize="10"
          fill="var(--color-muted-foreground)"
        >
          repo size (KB, log) →
        </text>
        <text
          x={10}
          y={pad}
          fontSize="10"
          fill="var(--color-muted-foreground)"
          transform={`rotate(-90 10 ${pad})`}
        >
          stars (log) →
        </text>
        {data.map((r) => (
          <circle
            key={r.id}
            cx={xScale(r.size)}
            cy={yScale(r.stargazers_count)}
            r={hover?.id === r.id ? 7 : 4}
            fill="oklch(0.85 0 0)"
            opacity={0.75}
            onMouseEnter={() => setHover(r)}
            onMouseLeave={() => setHover(null)}
            style={{ cursor: "pointer", transition: "r 0.15s" }}
          />
        ))}
      </svg>
      {hover && (
        <div className="absolute right-3 top-3 max-w-[60%] rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-card">
          <div className="font-display font-medium text-primary">{hover.name}</div>
          <div className="text-muted-foreground">
            ★ {hover.stargazers_count} · {hover.size.toLocaleString()} KB
            {hover.language ? ` · ${hover.language}` : ""}
          </div>
        </div>
      )}
    </div>
  );
}
