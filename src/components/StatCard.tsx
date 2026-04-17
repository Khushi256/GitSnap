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
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-card transition-colors hover:border-foreground/30">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className={accent}>{icon}</span>
      </div>
      <div className="mt-3 font-display text-3xl font-semibold text-foreground">
        <AnimatedCounter value={value} />
      </div>
    </div>
  );
}
