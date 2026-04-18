export function OSFootprint({ data }: { data: { personal: number; external: number } }) {
  const total = data.personal + data.external;
  if (total === 0) return <p className="text-sm text-muted-foreground flex h-full items-center justify-center">No recent activity detected.</p>;
  
  const personalPct = data.personal / total;
  const externalPct = data.external / total;

  return (
    <div className="flex h-full flex-col justify-center py-4">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <div className="text-3xl font-display font-semibold text-white">{Math.round(personalPct * 100)}%</div>
          <div className="text-[10px] uppercase tracking-widest text-indigo-300 font-medium">Personal Projects</div>
        </div>
        <div className="text-right space-y-1">
          <div className="text-3xl font-display font-semibold text-white">{Math.round(externalPct * 100)}%</div>
          <div className="text-[10px] uppercase tracking-widest text-violet-300 font-medium">Open Source / External</div>
        </div>
      </div>
      
      <div className="h-3 w-full flex overflow-hidden rounded-full bg-white/5 relative shadow-inner">
        <div 
          className="h-full bg-linear-to-r from-indigo-500 to-indigo-300 transition-all duration-1000" 
          style={{ width: `${personalPct * 100}%` }} 
          title={`Personal: ${data.personal} units`}
        />
        <div 
          className="h-full bg-linear-to-r from-violet-400 to-violet-300 transition-all duration-1000" 
          style={{ width: `${externalPct * 100}%` }} 
          title={`External: ${data.external} units`}
        />
      </div>
      
      <p className="mt-6 text-xs text-zinc-500 text-center">
        Analyzed <b>{total}</b> recent contributions across {total === 1 ? 'event' : 'events'} (commits, PRs, issues, etc).
      </p>
    </div>
  );
}

