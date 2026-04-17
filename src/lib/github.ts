export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  bio: string | null;
  twitter_username: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  forks_count: number;
  open_issues_count: number;
  topics?: string[];
  archived: boolean;
}

export interface GitHubEvent {
  id: string;
  type: string;
  created_at: string;
  repo: { name: string };
  payload: Record<string, unknown>;
}

const BASE = "https://api.github.com";

async function ghFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (res.status === 404) throw new Error("USER_NOT_FOUND");
  if (res.status === 403) throw new Error("RATE_LIMITED");
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.json() as Promise<T>;
}

export const fetchUser = (username: string) =>
  ghFetch<GitHubUser>(`/users/${encodeURIComponent(username)}`);

export const fetchRepos = (username: string) =>
  ghFetch<GitHubRepo[]>(`/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`);

export const fetchEvents = (username: string) =>
  ghFetch<GitHubEvent[]>(`/users/${encodeURIComponent(username)}/events/public?per_page=100`);

export async function fetchAll(username: string) {
  const [user, repos, events] = await Promise.all([
    fetchUser(username),
    fetchRepos(username),
    fetchEvents(username),
  ]);
  return { user, repos, events };
}

// ---------- derivations ----------

export function aggregateLanguages(repos: GitHubRepo[]) {
  const counts = new Map<string, number>();
  for (const r of repos) {
    if (r.fork || !r.language) continue;
    counts.set(r.language, (counts.get(r.language) ?? 0) + 1);
  }
  const entries = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, n]) => s + n, 0) || 1;
  return entries.map(([name, count]) => ({ name, count, pct: count / total }));
}

export function totalStars(repos: GitHubRepo[]) {
  return repos.reduce((s, r) => s + (r.fork ? 0 : r.stargazers_count), 0);
}

export function totalForks(repos: GitHubRepo[]) {
  return repos.reduce((s, r) => s + (r.fork ? 0 : r.forks_count), 0);
}

export function topRepo(repos: GitHubRepo[]) {
  return [...repos]
    .filter((r) => !r.fork)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)[0];
}

export function eventBreakdown(events: GitHubEvent[]) {
  const map = new Map<string, number>();
  for (const e of events) {
    const key = e.type.replace(/Event$/, "");
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

/** Build 52-week activity matrix from events (PushEvent commit counts). */
export function buildActivityWeeks(events: GitHubEvent[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDay = new Date(today);
  startDay.setDate(today.getDate() - 7 * 52 + 1);

  // Map yyyy-mm-dd -> count
  const dayCounts = new Map<string, number>();
  for (const e of events) {
    if (e.type !== "PushEvent") continue;
    const d = new Date(e.created_at);
    d.setHours(0, 0, 0, 0);
    if (d < startDay) continue;
    const commits = ((e.payload as { commits?: unknown[] }).commits?.length ?? 1) as number;
    const key = d.toISOString().slice(0, 10);
    dayCounts.set(key, (dayCounts.get(key) ?? 0) + commits);
  }

  const days: { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }[] = [];
  for (let i = 0; i < 7 * 52; i++) {
    const d = new Date(startDay);
    d.setDate(startDay.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const count = dayCounts.get(key) ?? 0;
    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (count >= 10) level = 4;
    else if (count >= 5) level = 3;
    else if (count >= 2) level = 2;
    else if (count >= 1) level = 1;
    days.push({ date: key, count, level });
  }
  return days;
}

export function currentStreak(days: { count: number }[]) {
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) streak++;
    else break;
  }
  return streak;
}

export function profileScore(user: GitHubUser, repos: GitHubRepo[]) {
  const stars = totalStars(repos);
  const followers = user.followers;
  const score = stars * 2 + followers * 3 + repos.filter((r) => !r.fork).length;

  if (score > 5000) return { label: "Open Source Legend", color: "from-yellow-400 to-orange-500" };
  if (score > 1500) return { label: "Power Contributor", color: "from-fuchsia-400 to-purple-500" };
  if (score > 400) return { label: "Rising Contributor", color: "from-blue-400 to-cyan-400" };
  if (score > 80) return { label: "Active Builder", color: "from-emerald-400 to-teal-400" };
  return { label: "Newcomer", color: "from-slate-400 to-slate-500" };
}
