import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  delta,
  tone = "neutral",
  hero = false,
}: {
  label: string;
  value: string;
  delta?: string;
  tone?: "pos" | "neg" | "neutral";
  hero?: boolean;
}) {
  return (
    <div
      className={cn(
        "bg-surface p-5 ring-1 ring-black/5 rounded-xl flex flex-col gap-2",
        hero && "border-l-2 border-brand",
      )}
    >
      <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</span>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-2xl font-mono text-zinc-900 tracking-tight leading-none tabular-nums">
          {value}
        </span>
        {delta && (
          <span
            className={cn(
              "text-xs font-mono font-medium tabular-nums",
              tone === "pos" && "text-emerald-600",
              tone === "neg" && "text-rose-600",
              tone === "neutral" && "text-zinc-400",
            )}
          >
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}