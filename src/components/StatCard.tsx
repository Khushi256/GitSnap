import { AnimatedCounter } from "./AnimatedCounter";
import type { ReactNode } from "react";

interface Props {
  label: string;
  value: number;
  icon: ReactNode;
  accent?: string;
}

export function StatCard({ label, value, icon, accent = "text-primary" }: Props) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm p-5 transition-all hover:border-white/20 hover:bg-white/5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-zinc-400">{label}</span>
        <span className={accent}>{icon}</span>
      </div>
      <div className="mt-3 font-display text-3xl font-semibold text-white">
        <AnimatedCounter value={value} />
      </div>
    </div>
  );
}
