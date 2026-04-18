import type { GitHubUser } from "@/lib/github";
import { useState } from "react";

interface Props {
  user: GitHubUser;
  badge: { label: string; color: string } | null;
  shareUrl: string;
}

export function ProfileHeader({ user, badge, shareUrl }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="rounded-2xl border border-indigo-500/30 bg-black/40 backdrop-blur-sm p-6 sm:p-8 hover:border-indigo-500/50 transition-colors">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <img
          src={user.avatar_url}
          alt={user.login}
          className="h-28 w-28 rounded-full border border-indigo-500/40"
        />
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-semibold gradient-text">
              {user.name ?? user.login}
            </h1>
            {badge && (
              <span className="inline-flex items-center rounded-full border border-indigo-500/40 bg-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-200">
                ★ {badge.label}
              </span>
            )}
          </div>
          <a
            href={user.html_url}
            target="_blank"
            rel="noreferrer"
            className="font-display text-sm text-indigo-300 hover:text-indigo-200 transition-colors"
          >
            @{user.login}
          </a>
          {user.bio && <p className="text-sm text-white/80">{user.bio}</p>}
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-zinc-400 mt-2">
            {user.location && <span>📍 {user.location}</span>}
            {user.company && <span>🏢 {user.company}</span>}
            {user.blog && (
              <a
                href={user.blog.startsWith("http") ? user.blog : `https://${user.blog}`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-primary"
              >
                🔗 {user.blog}
              </a>
            )}
            <span>
              📅 Joined{" "}
              {new Date(user.created_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
              })}
            </span>
          </div>
        </div>
        <button
          onClick={copy}
          className="self-start rounded-lg border border-border bg-secondary px-4 py-2 text-xs font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
        >
          {copied ? "✓ Link copied" : "🔗 Share profile"}
        </button>
      </div>
    </div>
  );
}
