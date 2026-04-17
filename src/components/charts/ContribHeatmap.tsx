import { useState } from "react";

interface Day {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

const COLORS = [
  "var(--color-contrib-0)",
  "var(--color-contrib-1)",
  "var(--color-contrib-2)",
  "var(--color-contrib-3)",
  "var(--color-contrib-4)",
];

export function ContribHeatmap({ days }: { days: Day[] }) {
  const [hover, setHover] = useState<{ x: number; y: number; day: Day } | null>(null);
  const cell = 12;
  const gap = 3;
  const weeks = 52;
  const width = weeks * (cell + gap);
  const height = 7 * (cell + gap);

  return (
    <div className="relative">
      <div className="overflow-x-auto pb-2">
        <svg width={width} height={height} className="block">
          {days.map((d, i) => {
            const week = Math.floor(i / 7);
            const dow = i % 7;
            return (
              <rect
                key={d.date}
                x={week * (cell + gap)}
                y={dow * (cell + gap)}
                width={cell}
                height={cell}
                rx={2}
                fill={COLORS[d.level]}
                onMouseEnter={(e) => {
                  const rect = (e.target as SVGRectElement).getBoundingClientRect();
                  const parent = (e.currentTarget.ownerSVGElement!
                    .parentElement as HTMLDivElement).getBoundingClientRect();
                  setHover({
                    x: rect.left - parent.left + cell / 2,
                    y: rect.top - parent.top,
                    day: d,
                  });
                }}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: "pointer", transition: "fill 0.2s" }}
              />
            );
          })}
        </svg>
      </div>
      {hover && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs shadow-card"
          style={{ left: hover.x, top: hover.y - 6 }}
        >
          <div className="font-display font-medium text-foreground">
            {hover.day.count} {hover.day.count === 1 ? "commit" : "commits"}
          </div>
          <div className="text-muted-foreground">{hover.day.date}</div>
        </div>
      )}
      <div className="mt-3 flex items-center justify-end gap-2 text-xs text-muted-foreground">
        <span>Less</span>
        {COLORS.map((c, i) => (
          <span
            key={i}
            className="inline-block h-3 w-3 rounded-sm"
            style={{ background: c }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
