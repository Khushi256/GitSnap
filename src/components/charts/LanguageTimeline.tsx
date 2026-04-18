import { JSX, useMemo } from "react";

export interface TimelineData {
  topLangs: string[];
  timeline: {
    year: number;
    languages: { [lang: string]: number };
    total: number;
  }[];
}

const COLORS = [
  "oklch(0.75 0.15 285)", // Soft Violet
  "oklch(0.65 0.2 240)", // Vibrant Blue
  "oklch(0.95 0.01 240)", // Pure White-ish
  "oklch(0.45 0.18 240)", // Deep Blue
  "oklch(0.55 0.2 290)", // Darker Violet
  "oklch(0.65 0.02 240)", // Medium Grey
];

export function LanguageTimeline({ data }: { data: TimelineData }) {
  if (data.timeline.length === 0) {
    return (
      <div className="flex h-48 w-full items-center justify-center rounded-xl border border-dashed border-border bg-card/50 text-sm text-muted-foreground">
        No repository data available.
      </div>
    );
  }

  const height = 200;
  const gap = 24;
  const barWidth = 48;
  const maxTotal = Math.max(...data.timeline.map((d) => d.total));
  const width = data.timeline.length * (barWidth + gap);

  // Map languages to colors
  const colorMap = new Map<string, string>();
  data.topLangs.forEach((lang, i) => colorMap.set(lang, COLORS[i]));
  colorMap.set("Other", COLORS[5]);

  return (
    <div className="flex flex-col space-y-6 w-full">
      <div className="w-full overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <svg width={Math.max(width, 300)} height={height} className="block min-w-full">
          {data.timeline.map((item, i) => {
            const x = i * (barWidth + gap) + 12; // Start with 12px padding
            let currentY = height - 24; // Leave 24px for year label at bottom

            const categories = [...data.topLangs, "Other"];
            const elements: JSX.Element[] = [];

            categories.forEach((lang) => {
              const count = item.languages[lang];
              if (count && count > 0) {
                // scale height relative to maxTotal
                const h = (count / maxTotal) * (height - 40); // Max bar height
                currentY -= h;
                elements.push(
                  <rect
                    key={`${item.year}-${lang}`}
                    x={x}
                    y={currentY}
                    width={barWidth}
                    height={h}
                    fill={colorMap.get(lang)}
                    rx={2}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    <title>{`${item.year} - ${lang}: ${count} repo${count === 1 ? "" : "s"}`}</title>
                  </rect>,
                );
              }
            });

            return (
              <g key={item.year}>
                {elements}
                <text
                  x={x + barWidth / 2}
                  y={height - 5}
                  textAnchor="middle"
                  className="fill-zinc-400 text-[11px] font-mono"
                >
                  {item.year}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
        {data.topLangs.map((lang) => (
          <div key={lang} className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: colorMap.get(lang) }} />
            <span className="text-zinc-200">{lang}</span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: colorMap.get("Other") }} />
          <span className="text-zinc-400">Other</span>
        </div>
      </div>
    </div>
  );
}
