export function WorkSchedule({ data }: { data: { weekday: number; weekend: number } }) {
  const total = data.weekday + data.weekend;
  if (total === 0)
    return (
      <p className="text-sm text-muted-foreground flex h-full items-center justify-center">
        No recent push events.
      </p>
    );

  // Normalize by number of days to prevent a 5-to-2 day bias
  const weekdayAvg = data.weekday / 5;
  const weekendAvg = data.weekend / 2;
  const avgTotal = weekdayAvg + weekendAvg;

  const weekdayPct = weekdayAvg / avgTotal;
  const weekendPct = weekendAvg / avgTotal;

  return (
    <div className="flex h-full flex-col justify-center py-4">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <div className="text-3xl font-display font-semibold text-white">
            {Math.round(weekdayPct * 100)}%
          </div>
          <div className="text-[10px] uppercase tracking-widest text-indigo-300 font-medium">
            Weekday
          </div>
        </div>
        <div className="text-right space-y-1">
          <div className="text-3xl font-display font-semibold text-white">
            {Math.round(weekendPct * 100)}%
          </div>
          <div className="text-[10px] uppercase tracking-widest text-cyan-300 font-medium">
            Weekend
          </div>
        </div>
      </div>

      <div className="h-3 w-full flex overflow-hidden rounded-full bg-white/5 relative shadow-inner">
        <div
          className="h-full bg-linear-to-r from-indigo-600 to-indigo-400 transition-all duration-1000"
          style={{ width: `${weekdayPct * 100}%` }}
          title={`Weekday: ${data.weekday} commits`}
        />
        <div
          className="h-full bg-linear-to-r from-cyan-400 to-cyan-300 transition-all duration-1000"
          style={{ width: `${weekendPct * 100}%` }}
          title={`Weekend: ${data.weekend} commits`}
        />
      </div>

      <p className="mt-6 text-xs text-zinc-500 text-center">
        Based on the last 100 public events, normalized by days per week.
      </p>
    </div>
  );
}
