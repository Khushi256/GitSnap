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
    <div className="group relative overflow-hidden rounded-xl border border-blue-500/20 bg-black backdrop-blur-sm p-5 transition-all hover:border-blue-500/40 hover:bg-blue-600/10">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-blue-300/70">{label}</span>
        <span className={accent}>{icon}</span>
      </div>
      <div className="mt-3 font-display text-3xl font-semibold text-blue-100">
        <AnimatedCounter value={value} />
      </div>
    </div>
  );
}
