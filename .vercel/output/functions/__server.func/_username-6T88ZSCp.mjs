import { J as reactExports, j as jsxRuntimeExports } from "./_ssr/index.mjs";
import { u as useParams } from "./_ssr/router-CL_lRxhK.mjs";
import "node:events";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
const BASE = "https://api.github.com";
async function ghFetch(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: "application/vnd.github+json" }
  });
  if (res.status === 404) throw new Error("USER_NOT_FOUND");
  if (res.status === 403) throw new Error("RATE_LIMITED");
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.json();
}
const fetchUser = (username) => ghFetch(`/users/${encodeURIComponent(username)}`);
const fetchRepos = (username) => ghFetch(`/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`);
const fetchEvents = (username) => ghFetch(`/users/${encodeURIComponent(username)}/events/public?per_page=100`);
async function fetchContributions(username, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(
        `https://github-contributions-api.deno.dev/${encodeURIComponent(username)}.json`
      );
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      const days = [];
      const levels = {
        NONE: 0,
        FIRST_QUARTILE: 1,
        SECOND_QUARTILE: 2,
        THIRD_QUARTILE: 3,
        FOURTH_QUARTILE: 4
      };
      for (const week of data.contributions) {
        for (const day of week) {
          days.push({
            date: day.date,
            count: day.contributionCount,
            level: levels[day.contributionLevel] ?? 0
          });
        }
      }
      return days.slice(-364);
    } catch (err) {
      if (i === retries) throw err;
      await new Promise((r) => setTimeout(r, 500 * Math.pow(2, i)));
    }
  }
  return null;
}
async function fetchAll(username) {
  const [user, repos, events] = await Promise.all([
    fetchUser(username),
    fetchRepos(username),
    fetchEvents(username)
  ]);
  return { user, repos, events };
}
function aggregateLanguages(repos) {
  const counts = /* @__PURE__ */ new Map();
  for (const r of repos) {
    if (r.fork || !r.language) continue;
    counts.set(r.language, (counts.get(r.language) ?? 0) + 1);
  }
  const entries = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, n]) => s + n, 0) || 1;
  return entries.map(([name, count]) => ({ name, count, pct: count / total }));
}
function totalStars(repos) {
  return repos.reduce((s, r) => s + (r.fork ? 0 : r.stargazers_count), 0);
}
function totalForks(repos) {
  return repos.reduce((s, r) => s + (r.fork ? 0 : r.forks_count), 0);
}
function topRepo(repos) {
  return [...repos].filter((r) => !r.fork).sort((a, b) => b.stargazers_count - a.stargazers_count)[0];
}
function eventBreakdown(events) {
  const map = /* @__PURE__ */ new Map();
  for (const e of events) {
    const key = e.type.replace(/Event$/, "");
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);
}
function currentStreak(days) {
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) streak++;
    else break;
  }
  return streak;
}
function profileScore(user, repos) {
  const stars = totalStars(repos);
  const followers = user.followers;
  const score = stars * 2 + followers * 3 + repos.filter((r) => !r.fork).length;
  if (score > 5e3) return { label: "Open Source Legend", color: "from-yellow-400 to-orange-500" };
  if (score > 1500) return { label: "Power Contributor", color: "from-fuchsia-400 to-purple-500" };
  if (score > 400) return { label: "Rising Contributor", color: "from-blue-400 to-cyan-400" };
  if (score > 80) return { label: "Active Builder", color: "from-emerald-400 to-teal-400" };
  return null;
}
function isRealProject(repo) {
  if (repo.fork) return false;
  const str = `${repo.name} ${repo.description || ""}`.toLowerCase();
  return !/(tutorial|clone|bootcamp|assignment|practice|todo|course)/i.test(str);
}
function computeWorkSchedule(events) {
  let weekday = 0;
  let weekend = 0;
  for (const e of events) {
    if (e.type !== "PushEvent") continue;
    const day = new Date(e.created_at).getDay();
    if (day === 0 || day === 6) weekend++;
    else weekday++;
  }
  return { weekday, weekend };
}
function computeOSFootprint(events, username, repos) {
  let personal = 0;
  let external = 0;
  let totalEvents = 0;
  const forkNames = new Set(repos.filter((r) => r.fork).map((r) => r.full_name.toLowerCase()));
  for (const e of events) {
    const relevantTypes = [
      "PushEvent",
      "PullRequestEvent",
      "IssuesEvent",
      "IssueCommentEvent",
      "ForkEvent",
      "PullRequestReviewEvent"
    ];
    if (!relevantTypes.includes(e.type)) continue;
    totalEvents++;
    const repoName = e.repo.name.toLowerCase();
    const owner = repoName.split("/")[0];
    const isPersonalRepo = owner === username.toLowerCase() && !forkNames.has(repoName);
    let weight = 1;
    if (e.type === "PushEvent") {
      weight = e.payload.commits?.length ?? 1;
    }
    if (isPersonalRepo) personal += weight;
    else external += weight;
  }
  return { personal, external, totalEvents };
}
function aggregateTopics(repos) {
  const map = /* @__PURE__ */ new Map();
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
    "typescript"
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
  return [...map.entries()].map(([topic, count]) => ({ topic, count })).sort((a, b) => b.count - a.count).slice(0, 15);
}
function computeLanguageTimeline(repos) {
  const years = /* @__PURE__ */ new Map();
  const allLangs = /* @__PURE__ */ new Map();
  for (const r of repos) {
    if (r.fork || !isRealProject(r)) continue;
    const year = new Date(r.created_at).getFullYear();
    const lang = r.language || "Unknown";
    if (!years.has(year)) years.set(year, {});
    const yearData = years.get(year);
    yearData[lang] = (yearData[lang] ?? 0) + 1;
    allLangs.set(lang, (allLangs.get(lang) ?? 0) + 1);
  }
  const topLangs = [...allLangs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map((x) => x[0]);
  return {
    topLangs,
    timeline: [...years.entries()].sort((a, b) => a[0] - b[0]).map(([year, langs]) => {
      const consolidated = {};
      topLangs.forEach((l) => consolidated[l] = 0);
      consolidated["Other"] = 0;
      let total = 0;
      for (const [l, count] of Object.entries(langs)) {
        if (topLangs.includes(l)) consolidated[l] += count;
        else consolidated["Other"] += count;
        total += count;
      }
      return { year, languages: consolidated, total };
    })
  };
}
function ProfileHeader({ user, badge, shareUrl }) {
  const [copied, setCopied] = reactExports.useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-2xl border border-indigo-500/50 bg-black/40 backdrop-blur-sm p-6 sm:p-8 hover:border-indigo-500/70 transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6 sm:flex-row sm:items-start", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "img",
      {
        src: user.avatar_url,
        alt: user.login,
        className: "h-28 w-28 rounded-full border border-indigo-500/40"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl font-semibold gradient-text", children: user.name ?? user.login }),
        badge && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center rounded-full border border-indigo-500/40 bg-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-200", children: [
          "★ ",
          badge.label
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "a",
        {
          href: user.html_url,
          target: "_blank",
          rel: "noreferrer",
          className: "font-display text-sm text-indigo-300 hover:text-indigo-200 transition-colors",
          children: [
            "@",
            user.login
          ]
        }
      ),
      user.bio && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-white/80", children: user.bio }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-x-5 gap-y-1 text-xs text-zinc-400 mt-2", children: [
        user.location && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          "📍 ",
          user.location
        ] }),
        user.company && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          "🏢 ",
          user.company
        ] }),
        user.blog && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "a",
          {
            href: user.blog.startsWith("http") ? user.blog : `https://${user.blog}`,
            target: "_blank",
            rel: "noreferrer",
            className: "hover:text-primary",
            children: [
              "🔗 ",
              user.blog
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          "📅 Joined",
          " ",
          new Date(user.created_at).toLocaleDateString(void 0, {
            year: "numeric",
            month: "short"
          })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: copy,
        className: "self-start rounded-lg border border-border bg-secondary px-4 py-2 text-xs font-medium text-foreground transition-colors hover:border-primary hover:text-primary",
        children: copied ? "✓ Link copied" : "🔗 Share profile"
      }
    )
  ] }) });
}
function AnimatedCounter({ value, duration = 1200, className }) {
  const [display, setDisplay] = reactExports.useState(0);
  const start = reactExports.useRef(null);
  const raf = reactExports.useRef(null);
  reactExports.useEffect(() => {
    start.current = null;
    const step = (ts) => {
      if (start.current === null) start.current = ts;
      const p = Math.min((ts - start.current) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(value * eased));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [value, duration]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className, children: display.toLocaleString() });
}
function StatCard({ label, value, icon, accent = "text-primary" }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "group relative overflow-hidden rounded-xl border border-white/20 bg-black/40 backdrop-blur-sm p-5 transition-all hover:border-white/30 hover:bg-white/5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs uppercase tracking-wider text-zinc-400", children: label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: accent, children: icon })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 font-display text-3xl font-semibold text-white", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatedCounter, { value }) })
  ] });
}
function Section({ title, subtitle, children, className = "" }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "section",
    {
      className: `rounded-xl border border-white/20 bg-black backdrop-blur-sm p-5 sm:p-6 transition-colors hover:border-blue-500/40 min-w-0 ${className}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-base font-semibold gradient-text", children: title }),
          subtitle && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-xs text-zinc-400", children: subtitle })
        ] }),
        children
      ]
    }
  );
}
const PALETTE = [
  "oklch(0.85 0.15 240)",
  // Bright Light Blue
  "oklch(0.7 0.18 220)",
  // Bright Cyan-Blue
  "oklch(0.75 0.15 260)",
  // Bright Indigo
  "oklch(0.65 0.2 240)",
  // Vibrant Blue
  "oklch(0.8 0.1 230)",
  // Soft Bright Blue
  "oklch(0.6 0.18 280)",
  // Vibrant Violet
  "oklch(0.9 0.05 240)",
  // Very Light Bright Blue
  "oklch(0.55 0.15 250)"
  // Deep Bright Indigo
];
function LanguageDonut({ data }) {
  const top = data.slice(0, 8);
  if (top.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No language data." });
  }
  const size = 220;
  const r = 80;
  const stroke = 28;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const segments = top.map((l, i) => {
    const len = l.pct * c;
    const seg = /* @__PURE__ */ jsxRuntimeExports.jsx(
      "circle",
      {
        cx: size / 2,
        cy: size / 2,
        r,
        fill: "none",
        stroke: PALETTE[i % PALETTE.length],
        strokeWidth: stroke,
        strokeDasharray: `${len} ${c - len}`,
        strokeDashoffset: -offset,
        style: {
          transition: "stroke-dasharray 0.8s ease, stroke-dashoffset 0.8s ease"
        }
      },
      l.name
    );
    offset += len;
    return seg;
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: size, height: size, className: "-rotate-90", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "circle",
        {
          cx: size / 2,
          cy: size / 2,
          r,
          fill: "none",
          stroke: "var(--color-border)",
          strokeWidth: stroke,
          opacity: 0.3
        }
      ),
      segments
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "flex-1 space-y-2 w-full", children: top.map((l, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center justify-between text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "span",
          {
            className: "inline-block h-3 w-3 rounded-sm",
            style: { background: PALETTE[i % PALETTE.length] }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-foreground", children: l.name })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-display text-muted-foreground", children: [
        (l.pct * 100).toFixed(1),
        "%"
      ] })
    ] }, l.name)) })
  ] });
}
const COLORS$2 = [
  "var(--color-contrib-0)",
  "var(--color-contrib-1)",
  "var(--color-contrib-2)",
  "var(--color-contrib-3)",
  "var(--color-contrib-4)"
];
function ContribHeatmap({ days }) {
  const [hover, setHover] = reactExports.useState(null);
  const cell = 16;
  const gap = 4;
  const weeks = Math.ceil(days.length / 7);
  const width = weeks * (cell + gap) + gap;
  const height = 7 * (cell + gap) + gap;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative w-full", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]", children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width, height, className: "block", children: days.map((d, i) => {
      const week = Math.floor(i / 7);
      const dow = i % 7;
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        "rect",
        {
          x: gap + week * (cell + gap),
          y: gap + dow * (cell + gap),
          width: cell,
          height: cell,
          rx: 3,
          fill: COLORS$2[d.level],
          onMouseEnter: (e) => {
            const rect = e.target.getBoundingClientRect();
            const parent = e.currentTarget.ownerSVGElement.parentElement.getBoundingClientRect();
            setHover({
              x: rect.left - parent.left + cell / 2,
              y: rect.top - parent.top,
              day: d
            });
          },
          onMouseLeave: () => setHover(null),
          style: {
            cursor: "pointer",
            transition: "filter 0.2s",
            filter: "drop-shadow(0 0 0 transparent)"
          },
          className: "hover:drop-shadow-lg"
        },
        d.date
      );
    }) }) }),
    hover && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-white/10 bg-black/60 backdrop-blur-md px-3 py-2 text-xs font-medium shadow-xl",
        style: { left: hover.x, top: hover.y - 8 },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-display font-semibold text-white", children: [
            hover.day.count,
            " ",
            hover.day.count === 1 ? "commit" : "commits"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-zinc-400", children: hover.day.date })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex items-center justify-end gap-2 text-xs text-zinc-400", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "Less" }),
      COLORS$2.map((c, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "span",
        {
          className: "inline-block h-3.5 w-3.5 rounded-sm transition-transform hover:scale-110",
          style: { background: c }
        },
        i
      )),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "More" })
    ] })
  ] });
}
function ActivityBars({ days }) {
  const weeksCount = Math.ceil(days.length / 7);
  const weeks = [];
  for (let w2 = 0; w2 < weeksCount; w2++) {
    let sum = 0;
    for (let d = 0; d < 7; d++) sum += days[w2 * 7 + d]?.count ?? 0;
    weeks.push(sum);
  }
  const max = Math.max(...weeks, 1);
  const w = 8;
  const gap = 2;
  const height = 120;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]", children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: weeks.length * (w + gap), height, className: "block", children: weeks.map((v, i) => {
    const h = v / max * (height - 8);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "rect",
      {
        x: i * (w + gap),
        y: height - h,
        width: w,
        height: h,
        rx: 2,
        fill: "oklch(0.8 0 0)",
        style: {
          transformOrigin: `${i * (w + gap) + w / 2}px ${height}px`,
          animation: `grow-bar 0.7s cubic-bezier(0.4,0,0.2,1) ${i * 0.01}s both`
        }
      },
      i
    );
  }) }) });
}
const COLORS$1 = {
  Push: "oklch(0.65 0.2 240)",
  // Vibrant Blue
  PullRequest: "oklch(0.7 0.18 220)",
  // Bright Cyan-Blue
  Issues: "oklch(0.85 0.15 240)",
  // Bright Light Blue
  IssueComment: "oklch(0.75 0.15 260)",
  // Bright Indigo
  Create: "oklch(0.8 0.1 230)",
  // Soft Bright Blue
  Fork: "oklch(0.9 0.05 240)",
  // Very Light Bright Blue
  Watch: "oklch(0.55 0.15 250)",
  // Deep Bright Indigo
  Delete: "oklch(0.6 0.18 280)",
  // Vibrant Violet
  Release: "oklch(0.7 0.18 220)",
  // Bright Cyan-Blue
  PullRequestReview: "oklch(0.75 0.15 260)",
  // Bright Indigo
  PullRequestReviewComment: "oklch(0.75 0.15 260)"
  // Bright Indigo
};
function EventBreakdown({ items }) {
  const total = items.reduce((s, i) => s + i.count, 0) || 1;
  if (items.length === 0)
    return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No recent activity." });
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: items.map((item) => {
    const pct = item.count / total * 100;
    const color = COLORS$1[item.type] ?? "#58a6ff";
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-1 flex items-center justify-between text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-foreground", children: item.type }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-display text-muted-foreground", children: [
          item.count,
          " · ",
          pct.toFixed(0),
          "%"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 overflow-hidden rounded-full bg-secondary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "h-full rounded-full transition-all duration-700",
          style: { width: `${pct}%`, background: color }
        }
      ) })
    ] }, item.type);
  }) });
}
const COLORS = [
  "oklch(0.85 0.15 240)",
  // Bright Light Blue
  "oklch(0.7 0.18 220)",
  // Bright Cyan-Blue
  "oklch(0.75 0.15 260)",
  // Bright Indigo
  "oklch(0.65 0.2 240)",
  // Vibrant Blue
  "oklch(0.8 0.1 230)",
  // Soft Bright Blue
  "oklch(0.4 0.05 250)"
  // Other (Darker neutral)
];
function LanguageTimeline({ data }) {
  if (data.timeline.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-48 w-full items-center justify-center rounded-xl border border-dashed border-border bg-card/50 text-sm text-muted-foreground", children: "No repository data available." });
  }
  const height = 200;
  const gap = 24;
  const barWidth = 48;
  const maxTotal = Math.max(...data.timeline.map((d) => d.total));
  const width = data.timeline.length * (barWidth + gap);
  const colorMap = /* @__PURE__ */ new Map();
  data.topLangs.forEach((lang, i) => colorMap.set(lang, COLORS[i]));
  colorMap.set("Other", COLORS[5]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col space-y-6 w-full", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]", children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: Math.max(width, 300), height, className: "block min-w-full", children: data.timeline.map((item, i) => {
      const x = i * (barWidth + gap) + 12;
      let currentY = height - 24;
      const categories = [...data.topLangs, "Other"];
      const elements = [];
      categories.forEach((lang) => {
        const count = item.languages[lang];
        if (count && count > 0) {
          const h = count / maxTotal * (height - 40);
          currentY -= h;
          elements.push(
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "rect",
              {
                x,
                y: currentY,
                width: barWidth,
                height: h,
                fill: colorMap.get(lang),
                rx: 2,
                className: "hover:opacity-80 transition-opacity cursor-pointer",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx("title", { children: `${item.year} - ${lang}: ${count} repo${count === 1 ? "" : "s"}` })
              },
              `${item.year}-${lang}`
            )
          );
        }
      });
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
        elements,
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "text",
          {
            x: x + barWidth / 2,
            y: height - 5,
            textAnchor: "middle",
            className: "fill-zinc-400 text-[11px] font-mono",
            children: item.year
          }
        )
      ] }, item.year);
    }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-x-5 gap-y-2 text-xs", children: [
      data.topLangs.map((lang) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-3 w-3 rounded-sm", style: { backgroundColor: colorMap.get(lang) } }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-zinc-200", children: lang })
      ] }, lang)),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-3 w-3 rounded-sm", style: { backgroundColor: colorMap.get("Other") } }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-zinc-400", children: "Other" })
      ] })
    ] })
  ] });
}
function WorkSchedule({ data }) {
  const total = data.weekday + data.weekend;
  if (total === 0)
    return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground flex h-full items-center justify-center", children: "No recent push events." });
  const weekdayAvg = data.weekday / 5;
  const weekendAvg = data.weekend / 2;
  const avgTotal = weekdayAvg + weekendAvg;
  const weekdayPct = weekdayAvg / avgTotal;
  const weekendPct = weekendAvg / avgTotal;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-full flex-col justify-center py-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-3xl font-display font-semibold text-white", children: [
          Math.round(weekdayPct * 100),
          "%"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] uppercase tracking-widest text-indigo-300 font-medium", children: "Weekday" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-3xl font-display font-semibold text-white", children: [
          Math.round(weekendPct * 100),
          "%"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] uppercase tracking-widest text-cyan-300 font-medium", children: "Weekend" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-3 w-full flex overflow-hidden rounded-full bg-white/5 relative shadow-inner", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "h-full bg-linear-to-r from-indigo-600 to-indigo-400 transition-all duration-1000",
          style: { width: `${weekdayPct * 100}%` },
          title: `Weekday: ${data.weekday} commits`
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "h-full bg-linear-to-r from-cyan-400 to-cyan-300 transition-all duration-1000",
          style: { width: `${weekendPct * 100}%` },
          title: `Weekend: ${data.weekend} commits`
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-6 text-xs text-zinc-500 text-center", children: "Based on the last 100 public events, normalized by days per week." })
  ] });
}
function OSFootprint({
  data
}) {
  const total = data.personal + data.external;
  if (total === 0)
    return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground flex h-full items-center justify-center", children: "No recent activity detected." });
  const personalPct = data.personal / total;
  const externalPct = data.external / total;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-full flex-col justify-center py-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-3xl font-display font-semibold text-white", children: [
          Math.round(personalPct * 100),
          "%"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] uppercase tracking-widest text-indigo-300 font-medium", children: "Personal Projects" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-3xl font-display font-semibold text-white", children: [
          Math.round(externalPct * 100),
          "%"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] uppercase tracking-widest text-violet-300 font-medium", children: "Open Source / External" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-3 w-full flex overflow-hidden rounded-full bg-white/5 relative shadow-inner", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "h-full bg-linear-to-r from-indigo-500 to-indigo-300 transition-all duration-1000",
          style: { width: `${personalPct * 100}%` },
          title: `Personal: ${data.personal} units`
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "h-full bg-linear-to-r from-violet-400 to-violet-300 transition-all duration-1000",
          style: { width: `${externalPct * 100}%` },
          title: `External: ${data.external} units`
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-6 text-xs text-zinc-500 text-center", children: [
      "Analyzed ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: total }),
      " recent contributions across ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: data.totalEvents }),
      " ",
      data.totalEvents === 1 ? "event" : "events",
      " (commits, PRs, issues, etc)."
    ] })
  ] });
}
function TopRepos({ repos }) {
  const [realOnly, setRealOnly] = reactExports.useState(false);
  const filtered = repos.filter((r) => !r.fork && (!realOnly || isRealProject(r)));
  const top = [...filtered].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 6);
  if (top.length === 0 && repos.length > 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No matching repos found." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => setRealOnly(false),
          className: "text-xs text-indigo-400 hover:text-indigo-300",
          children: "Show all"
        }
      )
    ] });
  }
  if (top.length === 0) return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No public repos." });
  const now = Date.now();
  const MS_PER_DAY = 1e3 * 60 * 60 * 24;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 text-xs text-zinc-400 cursor-pointer hover:text-white transition-colors", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          type: "checkbox",
          checked: realOnly,
          onChange: (e) => setRealOnly(e.target.checked),
          className: "rounded border-white/20 bg-black/20 text-indigo-500 focus:ring-indigo-500/30"
        }
      ),
      "Hide tutorials & coursework"
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3 sm:grid-cols-2", children: top.map((r) => {
      const created = new Date(r.created_at).getTime();
      const pushed = new Date(r.pushed_at || r.updated_at).getTime();
      const lastActiveDays = Math.floor((now - pushed) / MS_PER_DAY);
      const lifespanDays = Math.floor((pushed - created) / MS_PER_DAY);
      const lastActiveStr = lastActiveDays === 0 ? "Today" : lastActiveDays < 30 ? `${lastActiveDays}d ago` : `${Math.floor(lastActiveDays / 30)}mo ago`;
      const lifespanStr = lifespanDays > 365 ? `${(lifespanDays / 365).toFixed(1)}y` : lifespanDays > 30 ? `${Math.floor(lifespanDays / 30)}mo` : `${lifespanDays}d`;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "a",
        {
          href: r.html_url,
          target: "_blank",
          rel: "noreferrer",
          className: "group flex flex-col justify-between rounded-lg border border-white/20 bg-black backdrop-blur-sm p-4 transition-all hover:border-white/30 hover:bg-white/5",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate font-display text-sm font-medium text-white group-hover:text-zinc-200", children: r.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-display text-xs text-zinc-400", children: [
                  "★ ",
                  r.stargazers_count
                ] })
              ] }),
              r.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 line-clamp-2 text-xs text-white/60", children: r.description })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                r.language && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1.5 text-zinc-400", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-indigo-400" }),
                  r.language
                ] }),
                r.forks_count > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                  "⑂ ",
                  r.forks_count
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    className: "rounded border border-white/5 bg-white/5 px-1.5 py-0.5",
                    title: "Active duration",
                    children: lifespanStr
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    className: "rounded border border-white/5 bg-white/5 px-1.5 py-0.5",
                    title: "Last updated",
                    children: lastActiveStr
                  }
                )
              ] })
            ] })
          ]
        },
        r.id
      );
    }) })
  ] });
}
function SkeletonBlock({ className = "" }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: `animate-pulse rounded-md bg-secondary ${className}`,
      style: {
        background: "linear-gradient(90deg, var(--color-secondary) 0%, var(--color-muted) 50%, var(--color-secondary) 100%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.6s ease-in-out infinite"
      }
    }
  );
}
function DashboardSkeleton() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }` }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6 sm:flex-row", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "h-32 w-32 rounded-full" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "h-7 w-48" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "h-4 w-72" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "h-4 w-full max-w-md" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "h-8 w-40" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-4 md:grid-cols-4", children: Array.from({ length: 4 }).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "h-28" }, i)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "h-48" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-6 lg:grid-cols-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "h-72" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "h-72" })
    ] })
  ] });
}
function ProfilePage() {
  const {
    username
  } = useParams({
    from: "/$username"
  });
  const [data, setData] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState(null);
  const [contributions, setContributions] = reactExports.useState(null);
  const [contribLoading, setContribLoading] = reactExports.useState(true);
  reactExports.useEffect(() => {
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
        contribPromise.then((contribs) => {
          setContributions(contribs);
          setContribLoading(false);
        });
      } catch (e) {
        const msg = e.message === "USER_NOT_FOUND" ? `User "${username}" not found on GitHub.` : e.message === "RATE_LIMITED" ? "GitHub API rate limit hit. Please try again in a few minutes." : "Something went wrong. Please try again.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [username]);
  const derived = reactExports.useMemo(() => {
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
      timeline: computeLanguageTimeline(data.repos)
    };
  }, [data, contributions]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-0 bg-black" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative z-1 min-h-screen overflow-auto flex flex-col justify-start pt-20 sm:pt-24", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: "/", className: "fixed top-4 left-4 sm:top-6 sm:left-6 z-10 flex items-center gap-2 hover:opacity-80 transition-opacity animate-fade-in", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: "/gitsnap-logo.png", alt: "GitSnap", className: "h-7 w-7 sm:h-8 sm:w-8" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm sm:text-base font-bold gradient-text", children: "GitSnap" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto w-full max-w-6xl px-4 sm:px-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-6 flex items-center justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: "/", className: "inline-flex items-center gap-2 text-sm gradient-text hover:opacity-80 transition-opacity", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M19 12H5M12 19l-7-7 7-7" }) }),
          "New search"
        ] }) }),
        error && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto max-w-xl animate-fade-in rounded-xl border border-destructive/40 bg-destructive/10 p-5 text-center text-sm text-destructive mb-8", children: error }),
        loading && /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardSkeleton, {}),
        !loading && data && derived && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8 stagger", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ProfileHeader, { user: data.user, badge: derived.badge, shareUrl: derived.shareUrl }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4 md:grid-cols-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "Repos", value: data.user.public_repos, icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { name: "repo" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "Stars", value: derived.stars, icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { name: "star" }), accent: "text-indigo-400" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "Forks", value: derived.forks, icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { name: "fork" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "Followers", value: data.user.followers, icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { name: "users" }), accent: "text-indigo-400" }),
            contribLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "h-[92px] w-full" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "Day Streak", value: contributions ? currentStreak(contributions) : 0, icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { name: "flame" }), accent: "text-orange-400" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Section, { title: "Contribution heatmap", subtitle: "Last 52 weeks of public push activity", children: contribLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "h-48 w-full" }) : contributions ? /* @__PURE__ */ jsxRuntimeExports.jsx(ContribHeatmap, { days: contributions }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-48 w-full items-center justify-center rounded-xl border border-dashed border-border bg-card/50 text-sm text-muted-foreground", children: "Couldn't load contributions" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-8 lg:grid-cols-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Section, { title: "Weekly commit activity", subtitle: "Aggregated from public push events", children: contribLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "h-48 w-full" }) : contributions ? /* @__PURE__ */ jsxRuntimeExports.jsx(ActivityBars, { days: contributions }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-48 w-full items-center justify-center rounded-xl border border-dashed border-border bg-card/50 text-sm text-muted-foreground", children: "Couldn't load activity" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Section, { title: "Top languages", subtitle: "From non-fork public repos", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LanguageDonut, { data: derived.langs }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-8 lg:grid-cols-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Section, { title: "Work style", subtitle: "Breakdown of recent public events", children: /* @__PURE__ */ jsxRuntimeExports.jsx(EventBreakdown, { items: derived.events }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Section, { title: "Top repositories", subtitle: "By star count", children: /* @__PURE__ */ jsxRuntimeExports.jsx(TopRepos, { repos: data.repos }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-8 lg:grid-cols-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Section, { title: "Work Schedule", subtitle: "When do they code? (Weekday vs Weekend)", children: /* @__PURE__ */ jsxRuntimeExports.jsx(WorkSchedule, { data: derived.workSchedule }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Section, { title: "Open Source Footprint", subtitle: "Commits to personal vs external repositories", children: /* @__PURE__ */ jsxRuntimeExports.jsx(OSFootprint, { data: derived.osFootprint }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Section, { title: "Tech Stack Evolution", subtitle: "Repositories created per year, grouped by primary language", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LanguageTimeline, { data: derived.timeline }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("footer", { className: "pt-8 pb-4 text-center text-[10px] uppercase tracking-[0.2em] text-white/20 font-medium", children: "Powered by the GitHub API" })
        ] })
      ] })
    ] })
  ] });
}
function Icon({
  name
}) {
  const props = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round"
  };
  switch (name) {
    case "repo":
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { ...props, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" })
      ] });
    case "star":
      return /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { ...props, children: /* @__PURE__ */ jsxRuntimeExports.jsx("polygon", { points: "12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" }) });
    case "fork":
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { ...props, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "6", cy: "3", r: "2" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "18", cy: "3", r: "2" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "21", r: "2" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M6 5c0 7 6 13 6 13s6-6 6-13" })
      ] });
    case "users":
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { ...props, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "9", cy: "7", r: "4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M23 21v-2a4 4 0 0 0-3-3.87" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M16 3.13a4 4 0 0 1 0 7.75" })
      ] });
    case "flame":
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { ...props, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M12 2v10m0 0c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z", stroke: "currentColor", fill: "none" })
      ] });
  }
}
export {
  ProfilePage as component
};
