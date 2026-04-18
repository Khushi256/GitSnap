import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  fetchAll,
  fetchContributions,
  aggregateLanguages,
  totalStars,
  totalForks,
  topRepo,
  eventBreakdown,
  currentStreak,
  profileScore,
  computeWorkSchedule,
  computeOSFootprint,
  aggregateTopics,
  computeLanguageTimeline,
  type GitHubUser,
  type GitHubRepo,
  type GitHubEvent,
} from "@/lib/github";
import { ProfileHeader } from "@/components/ProfileHeader";
import { StatCard } from "@/components/StatCard";
import { Section } from "@/components/Section";
import { LanguageDonut } from "@/components/charts/LanguageDonut";
import { ContribHeatmap } from "@/components/charts/ContribHeatmap";
import { ActivityBars } from "@/components/charts/ActivityBars";
import { EventBreakdown } from "@/components/charts/EventBreakdown";
import { RepoScatter } from "@/components/charts/RepoScatter";
import { LanguageTimeline } from "@/components/charts/LanguageTimeline";
import { WorkSchedule } from "@/components/charts/WorkSchedule";
import { OSFootprint } from "@/components/charts/OSFootprint";
import { TopRepos } from "@/components/TopRepos";
import { DashboardSkeleton, SkeletonBlock } from "@/components/Skeleton";
import AnoAI from "@/components/ui/animated-shader-background";
import { SearchBar } from "@/components/SearchBar";

export const Route = createFileRoute("/$username")({
  head: () => ({
    meta: [
      { title: "GitSnap" },
      {
        name: "description",
        content:
          "Enter any GitHub username and explore a rich visual dashboard: contribution heatmap, languages, top repos, work-style breakdown, and more.",
      },
    ],
  }),
  component: ProfilePage,
});

interface Data {
  user: GitHubUser;
  repos: GitHubRepo[];
  events: GitHubEvent[];
}

function ProfilePage() {
  const { username } = useParams({ from: "/$username" });
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contributions, setContributions] = useState<{ date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }[] | null>(null);
  const [contribLoading, setContribLoading] = useState(true);

  useEffect(() => {
    if (!username) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      setData(null);
      setContribLoading(true);
      setContributions(null);
      
      const contribPromise = fetchContributions(username).catch(() => null);

      try {
        const result = await fetchAll(username);
        setData(result);
        
        contribPromise.then(contribs => {
          setContributions(contribs);
          setContribLoading(false);
        });
      } catch (e) {
        const msg =
          (e as Error).message === "USER_NOT_FOUND"
            ? `User "${username}" not found on GitHub.`
            : (e as Error).message === "RATE_LIMITED"
              ? "GitHub API rate limit hit. Please try again in a few minutes."
              : "Something went wrong. Please try again.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [username]);

  const derived = useMemo(() => {
    if (!data) return null;
    const langs = aggregateLanguages(data.repos);
    return {
      langs,
      stars: totalStars(data.repos),
      forks: totalForks(data.repos),
      top: topRepo(data.repos),
      events: eventBreakdown(data.events),
      badge: profileScore(data.user, data.repos),
      shareUrl: `${window.location.origin}/${data.user.login}`,
      workSchedule: computeWorkSchedule(data.events),
      osFootprint: computeOSFootprint(data.events, data.user.login, data.repos),
      topics: aggregateTopics(data.repos),
      timeline: computeLanguageTimeline(data.repos),
    };
  }, [data, contributions]);

  return (
    <>
      <div className="fixed inset-0 z-0 bg-black" />

      <div className="relative z-1 min-h-screen overflow-auto flex flex-col justify-start pt-20 sm:pt-24">
        {/* Logo in Top-Left Corner (Matches Landing Page) */}
        <a href="/" className="fixed top-4 left-4 sm:top-6 sm:left-6 z-10 flex items-center gap-2 hover:opacity-80 transition-opacity animate-fade-in">
          <img src="/gitsnap-logo.png" alt="GitSnap" className="h-7 w-7 sm:h-8 sm:w-8" />
          <span className="text-sm sm:text-base font-bold gradient-text">GitSnap</span>
        </a>

        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          {/* Header Back Button */}
          <div className="mb-6 flex items-center justify-end">
            <a
              href="/"
              className="inline-flex items-center gap-2 text-sm gradient-text hover:opacity-80 transition-opacity"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              New search
            </a>
          </div>

          {/* Error state */}
          {error && (
            <div className="mx-auto max-w-xl animate-fade-in rounded-xl border border-destructive/40 bg-destructive/10 p-5 text-center text-sm text-destructive mb-8">
              {error}
            </div>
          )}

          {/* Loading state */}
          {loading && <DashboardSkeleton />}

          {/* Data loaded */}
          {!loading && data && derived && (
            <div className="space-y-6 stagger">
              <ProfileHeader user={data.user} badge={derived.badge} shareUrl={derived.shareUrl} />

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
                  accent="text-indigo-400"
                />
                <StatCard label="Forks" value={derived.forks} icon={<Icon name="fork" />} />
                <StatCard
                  label="Followers"
                  value={data.user.followers}
                  icon={<Icon name="users" />}
                  accent="text-indigo-400"
                />
                {contribLoading ? (
                  <SkeletonBlock className="h-[92px] w-full" />
                ) : (
                  <StatCard
                    label="Day Streak"
                    value={contributions ? currentStreak(contributions) : 0}
                    icon={<Icon name="flame" />}
                    accent="text-orange-400"
                  />
                )}
              </div>

              <Section
                title="Contribution heatmap"
                subtitle="Last 52 weeks of public push activity"
              >
                {contribLoading ? (
                  <SkeletonBlock className="h-48 w-full" />
                ) : contributions ? (
                  <ContribHeatmap days={contributions} />
                ) : (
                  <div className="flex h-48 w-full items-center justify-center rounded-xl border border-dashed border-border bg-card/50 text-sm text-muted-foreground">
                    Couldn't load contributions
                  </div>
                )}
              </Section>

              <div className="grid gap-6 lg:grid-cols-2">
                <Section
                  title="Weekly commit activity"
                  subtitle="Aggregated from public push events"
                >
                  {contribLoading ? (
                    <SkeletonBlock className="h-48 w-full" />
                  ) : contributions ? (
                    <ActivityBars days={contributions} />
                  ) : (
                    <div className="flex h-48 w-full items-center justify-center rounded-xl border border-dashed border-border bg-card/50 text-sm text-muted-foreground">
                      Couldn't load activity
                    </div>
                  )}
                </Section>
                <Section title="Top languages" subtitle="From non-fork public repos">
                  <LanguageDonut data={derived.langs} />
                </Section>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Section title="Work style" subtitle="Breakdown of recent public events">
                  <EventBreakdown items={derived.events} />
                </Section>
                <Section title="Top repositories" subtitle="By star count">
                  <TopRepos repos={data.repos} />
                </Section>
              </div>
              
              <div className="grid gap-6 lg:grid-cols-2">
                <Section
                  title="Work Schedule"
                  subtitle="When do they code? (Weekday vs Weekend)"
                >
                  <WorkSchedule data={derived.workSchedule} />
                </Section>
                <Section
                  title="Open Source Footprint"
                  subtitle="Commits to personal vs external repositories"
                >
                  <OSFootprint data={derived.osFootprint} />
                </Section>
              </div>



              <Section
                title="Tech Stack Evolution"
                subtitle="Repositories created per year, grouped by primary language"
              >
                <LanguageTimeline data={derived.timeline} />
              </Section>

              <footer className="pt-4 text-center text-xs text-muted-foreground">
                Data from the public GitHub API · No authentication used · Rate limit: 60 req/hour
                per IP
              </footer>
            </div>
          )}
        </div>
      </div>
    </>
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
          <path d="M6 5c0 7 6 13 6 13s6-6 6-13" />
        </svg>
      );
    case "users":
      return (
        <svg {...props}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "flame":
      return (
        <svg {...props}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
          <path
            d="M12 2v10m0 0c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"
            stroke="currentColor"
            fill="none"
          />
        </svg>
      );
  }
}
