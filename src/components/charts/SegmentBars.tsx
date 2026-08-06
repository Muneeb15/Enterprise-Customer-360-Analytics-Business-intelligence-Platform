"use client";

import type { Segment } from "@/lib/api";

interface Props {
  segments: Segment[];
}

export function SegmentBars({ segments }: Props) {
  return (
    <div className="p-6 space-y-4">
      {segments.map((s, i) => (
        <div key={s.name} className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-700">{s.name}</span>
            <span className="font-mono text-zinc-500 tabular-nums">{s.share}%</span>
          </div>
          <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${s.share}%`,
                background: i < 2 ? "var(--brand)" : "rgba(0,0,0,0.25)",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
