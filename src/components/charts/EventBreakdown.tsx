interface Item {
  type: string;
  count: number;
}

const COLORS: Record<string, string> = {
  Push: "oklch(0.65 0.2 240)", // Vibrant Blue
  PullRequest: "oklch(0.7 0.18 220)", // Bright Cyan-Blue
  Issues: "oklch(0.85 0.15 240)", // Bright Light Blue
  IssueComment: "oklch(0.75 0.15 260)", // Bright Indigo
  Create: "oklch(0.8 0.1 230)", // Soft Bright Blue
  Fork: "oklch(0.9 0.05 240)", // Very Light Bright Blue
  Watch: "oklch(0.55 0.15 250)", // Deep Bright Indigo
  Delete: "oklch(0.6 0.18 280)", // Vibrant Violet
  Release: "oklch(0.7 0.18 220)", // Bright Cyan-Blue
  PullRequestReview: "oklch(0.75 0.15 260)", // Bright Indigo
  PullRequestReviewComment: "oklch(0.75 0.15 260)", // Bright Indigo
};

export function EventBreakdown({ items }: { items: Item[] }) {
  const total = items.reduce((s, i) => s + i.count, 0) || 1;
  if (items.length === 0)
    return <p className="text-sm text-muted-foreground">No recent activity.</p>;

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const pct = (item.count / total) * 100;
        const color = COLORS[item.type] ?? "#58a6ff";
        return (
          <div key={item.type}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-foreground">{item.type}</span>
              <span className="font-display text-muted-foreground">
                {item.count} · {pct.toFixed(0)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
