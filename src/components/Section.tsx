import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

export function Section({ title, subtitle, children, className = "" }: Props) {
  return (
    <section
      className={`rounded-xl border border-border bg-card p-5 shadow-card sm:p-6 ${className}`}
    >
      <header className="mb-4">
        <h2 className="font-display text-base font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}
