import type { GitHubRepo } from "@/lib/github";
import { isRealProject } from "@/lib/github";
import { useState } from "react";

export function TopRepos({ repos }: { repos: GitHubRepo[] }) {
  const [realOnly, setRealOnly] = useState(false);

  const filtered = repos.filter((r) => !r.fork && (!realOnly || isRealProject(r)));

  const top = [...filtered].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 6);

  if (top.length === 0 && repos.length > 0) {
    return (
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">No matching repos found.</p>
        <button
          onClick={() => setRealOnly(false)}
          className="text-xs text-indigo-400 hover:text-indigo-300"
        >
          Show all
        </button>
      </div>
    );
  }

  if (top.length === 0) return <p className="text-sm text-muted-foreground">No public repos.</p>;

  const now = Date.now();
  const MS_PER_DAY = 1000 * 60 * 60 * 24;

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer hover:text-white transition-colors">
          <input
            type="checkbox"
            checked={realOnly}
            onChange={(e) => setRealOnly(e.target.checked)}
            className="rounded border-white/20 bg-black/20 text-indigo-500 focus:ring-indigo-500/30"
          />
          Hide tutorials & coursework
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {top.map((r) => {
          const created = new Date(r.created_at).getTime();
          const pushed = new Date(r.pushed_at || r.updated_at).getTime();
          const lastActiveDays = Math.floor((now - pushed) / MS_PER_DAY);
          const lifespanDays = Math.floor((pushed - created) / MS_PER_DAY);

          const lastActiveStr =
            lastActiveDays === 0
              ? "Today"
              : lastActiveDays < 30
                ? `${lastActiveDays}d ago`
                : `${Math.floor(lastActiveDays / 30)}mo ago`;
          const lifespanStr =
            lifespanDays > 365
              ? `${(lifespanDays / 365).toFixed(1)}y`
              : lifespanDays > 30
                ? `${Math.floor(lifespanDays / 30)}mo`
                : `${lifespanDays}d`;

          return (
            <a
              key={r.id}
              href={r.html_url}
              target="_blank"
              rel="noreferrer"
              className="group flex flex-col justify-between rounded-lg border border-white/20 bg-black backdrop-blur-sm p-4 transition-all hover:border-white/30 hover:bg-white/5"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-display text-sm font-medium text-white group-hover:text-zinc-200">
                    {r.name}
                  </span>
                  <span className="font-display text-xs text-zinc-400">★ {r.stargazers_count}</span>
                </div>
                {r.description && (
                  <p className="mt-2 line-clamp-2 text-xs text-white/60">{r.description}</p>
                )}
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500">
                <div className="flex items-center gap-3">
                  {r.language && (
                    <span className="flex items-center gap-1.5 text-zinc-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                      {r.language}
                    </span>
                  )}
                  {r.forks_count > 0 && <span>⑂ {r.forks_count}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="rounded border border-white/5 bg-white/5 px-1.5 py-0.5"
                    title="Active duration"
                  >
                    {lifespanStr}
                  </span>
                  <span
                    className="rounded border border-white/5 bg-white/5 px-1.5 py-0.5"
                    title="Last updated"
                  >
                    {lastActiveStr}
                  </span>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
