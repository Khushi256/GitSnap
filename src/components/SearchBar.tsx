import { useState, type FormEvent } from "react";

interface Props {
  initial?: string;
  onSubmit: (username: string) => void;
  loading?: boolean;
}

export function SearchBar({ initial = "", onSubmit, loading }: Props) {
  const [value, setValue] = useState(initial);

  const handle = (e: FormEvent) => {
    e.preventDefault();
    const v = value.trim();
    if (v) onSubmit(v);
  };

  return (
    <form onSubmit={handle} className="flex w-full max-w-xl items-center gap-2">
      <div className="relative flex-1">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-blue-400"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter a GitHub username (e.g. torvalds)"
          autoFocus
          spellCheck={false}
          autoComplete="off"
          className="w-full rounded-lg border border-blue-500/30 bg-black/20 py-3 pl-10 pr-3 text-sm text-white outline-none transition-all placeholder:text-blue-300/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg gradient-button px-8 py-3 text-sm font-semibold transition-all active:opacity-80 disabled:opacity-60"
      >
        {loading ? "Loading…" : "ANALYZE"}
      </button>
    </form>
  );
}
