interface Item {
  type: string;
  count: number;
}

const COLORS: Record<string, string> = {
  Push: "oklch(0.9 0 0)",
  PullRequest: "oklch(0.75 0 0)",
  Issues: "oklch(0.65 0 0)",
  IssueComment: "oklch(0.6 0 0)",
  Create: "oklch(0.72 0.04 240)",
  Fork: "oklch(0.55 0 0)",
  Watch: "oklch(0.5 0 0)",
  Delete: "oklch(0.45 0 0)",
  Release: "oklch(0.6 0.05 240)",
  PullRequestReview: "oklch(0.7 0 0)",
  PullRequestReviewComment: "oklch(0.7 0 0)",
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
