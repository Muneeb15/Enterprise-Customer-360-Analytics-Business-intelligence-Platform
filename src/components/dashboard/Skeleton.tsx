import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  lines?: number;
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-md bg-zinc-100", className)} />
  );
}

export function KpiCardSkeleton() {
  return (
    <div className="bg-surface p-5 ring-1 ring-black/5 rounded-xl flex flex-col gap-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-7 w-32" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-6 py-3.5">
          <Skeleton className={cn("h-3", i === 0 ? "w-32" : "w-20")} />
        </td>
      ))}
    </tr>
  );
}

export function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="bg-surface ring-1 ring-black/5 rounded-xl p-6 space-y-4">
      <Skeleton className="h-4 w-32" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = 72 }: { height?: number }) {
  return (
    <div className={`bg-surface ring-1 ring-black/5 rounded-xl p-6 h-${height}`}>
      <Skeleton className="h-4 w-28 mb-6" />
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  );
}
