import type { GitHubUser } from "@/lib/github";
import { useState } from "react";

interface Props {
  user: GitHubUser;
  badge: { label: string; color: string };
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
    <div className="rounded-2xl border border-blue-500/20 bg-black backdrop-blur-sm p-6 sm:p-8 hover:border-blue-500/40 transition-colors">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <img
          src={user.avatar_url}
          alt={user.login}
          className="h-28 w-28 rounded-full border border-blue-500/30"
        />
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-semibold gradient-text">
              {user.name ?? user.login}
            </h1>
            <span className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">
              ★ {badge.label}
            </span>
          </div>
          <a
            href={user.html_url}
            target="_blank"
            rel="noreferrer"
            className="font-display text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            @{user.login}
          </a>
          {user.bio && <p className="text-sm text-white/70">{user.bio}</p>}
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-blue-300/70">
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
