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
      className={`rounded-xl border border-blue-500/20 bg-black backdrop-blur-sm p-5 sm:p-6 transition-colors hover:border-blue-500/40 ${className}`}
    >
      <header className="mb-4">
        <h2 className="font-display text-base font-semibold gradient-text">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-blue-300/60">{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}
