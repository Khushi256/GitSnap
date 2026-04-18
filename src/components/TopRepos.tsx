import type { GitHubRepo } from "@/lib/github";

export function TopRepos({ repos }: { repos: GitHubRepo[] }) {
  const top = [...repos]
    .filter((r) => !r.fork)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 6);

  if (top.length === 0) return <p className="text-sm text-muted-foreground">No public repos.</p>;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {top.map((r) => (
        <a
          key={r.id}
          href={r.html_url}
          target="_blank"
          rel="noreferrer"
          className="group block rounded-lg border border-blue-500/20 bg-black backdrop-blur-sm p-4 transition-all hover:border-blue-500/40 hover:bg-blue-600/10"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="truncate font-display text-sm font-medium text-blue-300 group-hover:text-blue-200">
              {r.name}
            </span>
            <span className="font-display text-xs text-blue-400">★ {r.stargazers_count}</span>
          </div>
          {r.description && (
            <p className="mt-2 line-clamp-2 text-xs text-white/60">{r.description}</p>
          )}
          <div className="mt-3 flex items-center gap-3 text-xs text-blue-300/70">
            {r.language && (
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-400" />
                {r.language}
              </span>
            )}
            <span>⑂ {r.forks_count}</span>
          </div>
        </a>
      ))}
    </div>
  );
}
