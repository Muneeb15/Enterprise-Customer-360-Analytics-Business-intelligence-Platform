import { Skeleton, KpiCardSkeleton } from "./Skeleton";

/** Full-page loading skeleton — shown instantly while data loads. */
export function PageSkeleton({ kpis = false, rows = 5 }: { kpis?: boolean; rows?: number }) {
  return (
    <div className="px-8 py-6 space-y-6 animate-pulse">
      {/* Page header */}
      <div className="pt-2 pb-4 border-b border-zinc-950/5 space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* KPI cards */}
      {kpis && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)}
        </div>
      )}

      {/* Chart placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-surface ring-1 ring-black/5 rounded-xl p-6">
          <Skeleton className="h-4 w-28 mb-4" />
          <Skeleton className="h-52 w-full rounded-lg" />
        </div>
        <div className="bg-surface ring-1 ring-black/5 rounded-xl p-6">
          <Skeleton className="h-4 w-24 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-8" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table placeholder */}
      <div className="bg-surface ring-1 ring-black/5 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-950/5">
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="divide-y divide-zinc-950/5">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="px-6 py-3.5 flex items-center gap-4">
              <Skeleton className="size-6 rounded-full shrink-0" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-20 ml-auto" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
