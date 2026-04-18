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

export async function fetchContributions(username: string, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(
        `https://github-contributions-api.deno.dev/${encodeURIComponent(username)}.json`,
      );
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();

      // Adapt Deno API response to our days format
      const days: { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }[] = [];
      const levels: Record<string, 0 | 1 | 2 | 3 | 4> = {
        NONE: 0,
        FIRST_QUARTILE: 1,
        SECOND_QUARTILE: 2,
        THIRD_QUARTILE: 3,
        FOURTH_QUARTILE: 4,
      };

      for (const week of data.contributions) {
        for (const day of week) {
          days.push({
            date: day.date,
            count: day.contributionCount,
            level: levels[day.contributionLevel as keyof typeof levels] ?? 0,
          });
        }
      }
      return days.slice(-364);
    } catch (err) {
      if (i === retries) throw err;
      // Exponential backoff
      await new Promise((r) => setTimeout(r, 500 * Math.pow(2, i)));
    }
  }
  return null;
}

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
  return null;
}

export function isRealProject(repo: GitHubRepo) {
  if (repo.fork) return false;
  const str = `${repo.name} ${repo.description || ""}`.toLowerCase();
  return !/(tutorial|clone|bootcamp|assignment|practice|todo|course)/i.test(str);
}

export function computeWorkSchedule(events: GitHubEvent[]) {
  let weekday = 0;
  let weekend = 0;
  for (const e of events) {
    if (e.type !== "PushEvent") continue;
    const day = new Date(e.created_at).getDay(); // 0 = Sunday, 6 = Saturday
    if (day === 0 || day === 6) weekend++;
    else weekday++;
  }
  return { weekday, weekend };
}

export function computeOSFootprint(events: GitHubEvent[], username: string, repos: GitHubRepo[]) {
  let personal = 0;
  let external = 0;
  let totalEvents = 0;

  // Set of repo full names that are forks to accurately categorize activity
  const forkNames = new Set(repos.filter((r) => r.fork).map((r) => r.full_name.toLowerCase()));

  for (const e of events) {
    // Include a broader range of contribution events
    const relevantTypes = [
      "PushEvent",
      "PullRequestEvent",
      "IssuesEvent",
      "IssueCommentEvent",
      "ForkEvent",
      "PullRequestReviewEvent",
    ];

    if (!relevantTypes.includes(e.type)) continue;

    totalEvents++;

    const repoName = e.repo.name.toLowerCase();
    const owner = repoName.split("/")[0];

    // It's personal ONLY if the user owns it AND it's not a fork
    // Contributions to forks are better categorized as Open Source/External
    const isPersonalRepo = owner === username.toLowerCase() && !forkNames.has(repoName);

    let weight = 1;
    if (e.type === "PushEvent") {
      // Weight push events by the number of commits
      weight = (e.payload as { commits?: unknown[] }).commits?.length ?? 1;
    }

    if (isPersonalRepo) personal += weight;
    else external += weight;
  }
  return { personal, external, totalEvents };
}

export function aggregateTopics(repos: GitHubRepo[]) {
  const map = new Map<string, number>();

  // High-value keywords to extract from descriptions if explicit topics aren't used
  const keywords = [
    "react",
    "vue",
    "angular",
    "svelte",
    "nextjs",
    "nuxtjs",
    "node",
    "express",
    "django",
    "flask",
    "fastapi",
    "spring",
    "docker",
    "kubernetes",
    "aws",
    "gcp",
    "azure",
    "firebase",
    "supabase",
    "mongodb",
    "postgresql",
    "mysql",
    "redis",
    "graphql",
    "trpc",
    "tailwind",
    "prisma",
    "tensorflow",
    "pytorch",
    "rust",
    "golang",
    "swift",
    "kotlin",
    "typescript",
  ];

  for (const r of repos) {
    if (r.fork || !isRealProject(r)) continue;

    if (r.topics) {
      for (const t of r.topics) {
        map.set(t, (map.get(t) ?? 0) + 1);
      }
    }

    if (r.description) {
      const desc = r.description.toLowerCase();
      for (const kw of keywords) {
        const regex = new RegExp(`\\b${kw.replace("js", "(\\.js|js)?")}\\b`);
        if (regex.test(desc)) {
          map.set(kw, (map.get(kw) ?? 0) + 1);
        }
      }
    }
  }

  return [...map.entries()]
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);
}

export function computeLanguageTimeline(repos: GitHubRepo[]) {
  const years = new Map<number, { [lang: string]: number }>();
  const allLangs = new Map<string, number>();

  for (const r of repos) {
    if (r.fork || !isRealProject(r)) continue;
    const year = new Date(r.created_at).getFullYear();
    const lang = r.language || "Unknown";

    if (!years.has(year)) years.set(year, {});
    const yearData = years.get(year)!;
    yearData[lang] = (yearData[lang] ?? 0) + 1;
    allLangs.set(lang, (allLangs.get(lang) ?? 0) + 1);
  }

  const topLangs = [...allLangs.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map((x) => x[0]);

  return {
    topLangs,
    timeline: [...years.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([year, langs]) => {
        const consolidated: { [lang: string]: number } = {};
        topLangs.forEach((l) => (consolidated[l] = 0));
        consolidated["Other"] = 0;

        let total = 0;
        for (const [l, count] of Object.entries(langs)) {
          if (topLangs.includes(l)) consolidated[l] += count;
          else consolidated["Other"] += count;
          total += count;
        }
        return { year, languages: consolidated, total };
      }),
  };
}
