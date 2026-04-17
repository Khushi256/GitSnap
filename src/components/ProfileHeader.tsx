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
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <img
          src={user.avatar_url}
          alt={user.login}
          className="h-28 w-28 rounded-full border border-border"
        />
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-semibold text-foreground">
              {user.name ?? user.login}
            </h1>
            <span className="inline-flex items-center rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-foreground">
              ★ {badge.label}
            </span>
          </div>
          <a
            href={user.html_url}
            target="_blank"
            rel="noreferrer"
            className="font-display text-sm text-primary hover:underline"
          >
            @{user.login}
          </a>
          {user.bio && <p className="text-sm text-foreground/80">{user.bio}</p>}
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
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
              📅 Joined {new Date(user.created_at).toLocaleDateString(undefined, {
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
