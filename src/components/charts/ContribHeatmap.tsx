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
  const cell = 16;
  const gap = 4;
  const weeks = 52;
  const width = weeks * (cell + gap) + gap;
  const height = 7 * (cell + gap) + gap;

  return (
    <div className="relative">
      <div className="overflow-x-auto pb-4">
        <svg width={width} height={height} className="block">
          {days.map((d, i) => {
            const week = Math.floor(i / 7);
            const dow = i % 7;
            return (
              <rect
                key={d.date}
                x={gap + week * (cell + gap)}
                y={gap + dow * (cell + gap)}
                width={cell}
                height={cell}
                rx={3}
                fill={COLORS[d.level]}
                onMouseEnter={(e) => {
                  const rect = (e.target as SVGRectElement).getBoundingClientRect();
                  const parent = (
                    e.currentTarget.ownerSVGElement!.parentElement as HTMLDivElement
                  ).getBoundingClientRect();
                  setHover({
                    x: rect.left - parent.left + cell / 2,
                    y: rect.top - parent.top,
                    day: d,
                  });
                }}
                onMouseLeave={() => setHover(null)}
                style={{
                  cursor: "pointer",
                  transition: "filter 0.2s",
                  filter: "drop-shadow(0 0 0 transparent)",
                }}
                className="hover:drop-shadow-lg"
              />
            );
          })}
        </svg>
      </div>
      {hover && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-blue-500/30 bg-black/40 backdrop-blur-sm px-3 py-2 text-xs font-medium shadow-lg"
          style={{ left: hover.x, top: hover.y - 8 }}
        >
          <div className="font-display font-semibold text-blue-200">
            {hover.day.count} {hover.day.count === 1 ? "commit" : "commits"}
          </div>
          <div className="text-blue-300/70">{hover.day.date}</div>
        </div>
      )}
      <div className="mt-4 flex items-center justify-end gap-2 text-xs text-blue-300/70">
        <span className="font-medium">Less</span>
        {COLORS.map((c, i) => (
          <span
            key={i}
            className="inline-block h-3.5 w-3.5 rounded-sm transition-transform hover:scale-110"
            style={{ background: c }}
          />
        ))}
        <span className="font-medium">More</span>
      </div>
    </div>
  );
}
