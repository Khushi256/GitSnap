export function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-secondary ${className}`}
      style={{
        background:
          "linear-gradient(90deg, var(--color-secondary) 0%, var(--color-muted) 50%, var(--color-secondary) 100%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.6s ease-in-out infinite",
      }}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
      <div className="flex flex-col gap-6 sm:flex-row">
        <SkeletonBlock className="h-32 w-32 rounded-full" />
        <div className="flex-1 space-y-3">
          <SkeletonBlock className="h-7 w-48" />
          <SkeletonBlock className="h-4 w-72" />
          <SkeletonBlock className="h-4 w-full max-w-md" />
          <SkeletonBlock className="h-8 w-40" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-28" />
        ))}
      </div>
      <SkeletonBlock className="h-48" />
      <div className="grid gap-6 lg:grid-cols-2">
        <SkeletonBlock className="h-72" />
        <SkeletonBlock className="h-72" />
      </div>
    </div>
  );
}
