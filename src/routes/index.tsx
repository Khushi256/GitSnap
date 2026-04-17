import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  fetchAll,
  aggregateLanguages,
  totalStars,
  totalForks,
  topRepo,
  eventBreakdown,
  buildActivityWeeks,
  currentStreak,
  profileScore,
  type GitHubUser,
  type GitHubRepo,
  type GitHubEvent,
} from "@/lib/github";
import { SearchBar } from "@/components/SearchBar";
import { ProfileHeader } from "@/components/ProfileHeader";
import { StatCard } from "@/components/StatCard";
import { Section } from "@/components/Section";
import { LanguageDonut } from "@/components/charts/LanguageDonut";
import { ContribHeatmap } from "@/components/charts/ContribHeatmap";
import { ActivityBars } from "@/components/charts/ActivityBars";
import { EventBreakdown } from "@/components/charts/EventBreakdown";
import { RepoScatter } from "@/components/charts/RepoScatter";
import { RepoTimeline } from "@/components/charts/RepoTimeline";
import { TopRepos } from "@/components/TopRepos";
import { DashboardSkeleton } from "@/components/Skeleton";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GitHub Profile Visualizer — Stats, Languages, Activity" },
      {
        name: "description",
        content:
          "Enter any GitHub username and explore a rich visual dashboard: contribution heatmap, languages, top repos, work-style breakdown, and more.",
      },
      { property: "og:title", content: "GitHub Profile Visualizer" },
      {
        property: "og:description",
        content:
          "A visually rich dashboard of any GitHub user's activity — built with custom SVG charts.",
      },
    ],
  }),
  component: Index,
});

interface Data {
  user: GitHubUser;
  repos: GitHubRepo[];
  events: GitHubEvent[];
}

function Index() {
  const [username, setUsername] = useState<string>("");
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read ?user= on first load and listen for back/forward
  useEffect(() => {
    const sync = () => {
      const params = new URLSearchParams(window.location.search);
      const u = params.get("user");
      if (u) {
        setUsername(u);
        load(u, false);
      }
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async (u: string, push = true) => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const result = await fetchAll(u);
      setData(result);
      setUsername(u);
      if (push) {
        const url = new URL(window.location.href);
        url.searchParams.set("user", u);
        window.history.pushState({}, "", url);
      }
    } catch (e) {
      const msg =
        (e as Error).message === "USER_NOT_FOUND"
          ? `User "${u}" not found on GitHub.`
          : (e as Error).message === "RATE_LIMITED"
            ? "GitHub API rate limit hit. Please try again in a few minutes."
            : "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const derived = useMemo(() => {
    if (!data) return null;
    const days = buildActivityWeeks(data.events);
    return {
      langs: aggregateLanguages(data.repos),
      stars: totalStars(data.repos),
      forks: totalForks(data.repos),
      top: topRepo(data.repos),
      events: eventBreakdown(data.events),
      days,
      streak: currentStreak(days),
      badge: profileScore(data.user, data.repos),
      shareUrl: `${window.location.origin}/?user=${data.user.login}`,
    };
  }, [data]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        {/* Hero */}
        <header className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Powered by the public GitHub REST API
          </div>
          <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            GitHub <span className="text-foreground/70">Profile Visualizer</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Explore any developer's contribution graph, top languages, repos, and
            work style — beautifully visualized with custom SVG charts.
          </p>
          <div className="mt-6 flex justify-center">
            <SearchBar initial={username} onSubmit={(u) => load(u)} loading={loading} />
          </div>
          {!loading && !data && !error && (
            <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
              <span>Try:</span>
              {["torvalds", "gaearon", "tj", "sindresorhus", "yyx990803"].map((u) => (
                <button
                  key={u}
                  onClick={() => load(u)}
                  className="rounded-full border border-border bg-card px-3 py-1 text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  @{u}
                </button>
              ))}
            </div>
          )}
        </header>

        {/* Body */}
        {error && (
          <div className="mx-auto max-w-xl animate-fade-in rounded-xl border border-destructive/40 bg-destructive/10 p-5 text-center text-sm text-destructive">
            {error}
          </div>
        )}

        {loading && <DashboardSkeleton />}

        {!loading && data && derived && (
          <div className="space-y-6 stagger">
            <ProfileHeader
              user={data.user}
              badge={derived.badge}
              shareUrl={derived.shareUrl}
            />

            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              <StatCard
                label="Repos"
                value={data.user.public_repos}
                icon={<Icon name="repo" />}
              />
              <StatCard
                label="Stars"
                value={derived.stars}
                icon={<Icon name="star" />}
                accent="text-warning"
              />
              <StatCard
                label="Forks"
                value={derived.forks}
                icon={<Icon name="fork" />}
              />
              <StatCard
                label="Followers"
                value={data.user.followers}
                icon={<Icon name="users" />}
                accent="text-accent"
              />
              <StatCard
                label="Day Streak"
                value={derived.streak}
                icon={<Icon name="flame" />}
                accent="text-warning"
              />
            </div>

            <Section
              title="Contribution heatmap"
              subtitle="Last 52 weeks of public push activity"
            >
              <ContribHeatmap days={derived.days} />
            </Section>

            <div className="grid gap-6 lg:grid-cols-2">
              <Section
                title="Weekly commit activity"
                subtitle="Aggregated from public push events"
              >
                <ActivityBars days={derived.days} />
              </Section>
              <Section title="Top languages" subtitle="From non-fork public repos">
                <LanguageDonut data={derived.langs} />
              </Section>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Section
                title="Work style"
                subtitle="Breakdown of recent public events"
              >
                <EventBreakdown items={derived.events} />
              </Section>
              <Section title="Top repositories" subtitle="By star count">
                <TopRepos repos={data.repos} />
              </Section>
            </div>

            <Section
              title="Repo size vs stars"
              subtitle="Each dot = a repo. Log scale on both axes."
            >
              <RepoScatter repos={data.repos} />
            </Section>

            <Section
              title="Repo creation timeline"
              subtitle="When repositories were first created"
            >
              <RepoTimeline repos={data.repos} />
            </Section>

            <footer className="pt-4 text-center text-xs text-muted-foreground">
              Data from the public GitHub API · No authentication used · Rate limit: 60
              req/hour per IP
            </footer>
          </div>
        )}

        {!loading && !data && !error && (
          <div className="mx-auto mt-16 max-w-md text-center text-sm text-muted-foreground">
            Enter a username above to begin.
          </div>
        )}
      </div>
    </div>
  );
}

function Icon({ name }: { name: "repo" | "star" | "fork" | "users" | "flame" }) {
  const props = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "repo":
      return (
        <svg {...props}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case "star":
      return (
        <svg {...props}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    case "fork":
      return (
        <svg {...props}>
          <circle cx="6" cy="3" r="2" />
          <circle cx="18" cy="3" r="2" />
          <circle cx="12" cy="21" r="2" />
          <path d="M6 5v4a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4V5" />
          <path d="M12 13v6" />
        </svg>
      );
    case "users":
      return (
        <svg {...props}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "flame":
      return (
        <svg {...props}>
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </svg>
      );
  }
}
