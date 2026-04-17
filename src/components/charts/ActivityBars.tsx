interface Day {
  date: string;
  count: number;
}

/** 52-week aggregated weekly bar chart of commit activity. */
export function ActivityBars({ days }: { days: Day[] }) {
  const weeks: number[] = [];
  for (let w = 0; w < 52; w++) {
    let sum = 0;
    for (let d = 0; d < 7; d++) sum += days[w * 7 + d]?.count ?? 0;
    weeks.push(sum);
  }
  const max = Math.max(...weeks, 1);
  const w = 8;
  const gap = 2;
  const height = 120;

  return (
    <div className="overflow-x-auto">
      <svg width={weeks.length * (w + gap)} height={height} className="block">
        {weeks.map((v, i) => {
          const h = (v / max) * (height - 8);
          return (
            <rect
              key={i}
              x={i * (w + gap)}
              y={height - h}
              width={w}
              height={h}
              rx={2}
              fill="oklch(0.7 0 0)"
              style={{
                transformOrigin: `${i * (w + gap) + w / 2}px ${height}px`,
                animation: `grow-bar 0.7s cubic-bezier(0.4,0,0.2,1) ${i * 0.01}s both`,
              }}
            />
          );
        })}
      </svg>
    </div>
  );
}
