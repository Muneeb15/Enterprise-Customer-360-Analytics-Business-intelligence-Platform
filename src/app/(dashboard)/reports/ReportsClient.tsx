"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api";
import { Panel } from "@/components/dashboard/Panel";
import { FileText, Search } from "lucide-react";

export function ReportsClient() {
  const sp = useSearchParams();
  const router = useRouter();

  const q = sp.get("q") ?? "";
  const type = sp.get("type") ?? "";

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(sp.toString());
    value ? next.set(key, value) : next.delete(key);
    router.push(`?${next.toString()}`, { scroll: false });
  }

  const { data: reportsPage } = useQuery({
    queryKey: ["reports", { type }],
    queryFn: () => api.getReports({ type: type || undefined }),
  });
  const reports = reportsPage?.items ?? [];
  const types = Array.from(new Set(reports.map((r: { type: string }) => r.type)));
  const qLower = q.trim().toLowerCase();
  const filtered = reports.filter((r) => !qLower || r.name.toLowerCase().includes(qLower));

  return (
    <>
      <div className="px-8 pt-8 pb-2">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Report Center</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          {filtered.length} of {reports.length} reports
        </p>
      </div>

      <div className="px-8 pb-10 space-y-6">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400" />
            <input
              type="search"
              value={q}
              onChange={(e) => setParam("q", e.target.value)}
              placeholder="Search reports…"
              className="w-full text-sm bg-surface ring-1 ring-black/5 rounded-md pl-8 pr-3 py-1.5 focus:ring-brand/40 focus:outline-none"
            />
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setParam("type", "")}
              className={
                "text-[10px] font-medium uppercase tracking-wider px-2 py-1 rounded " +
                (!type ? "bg-zinc-100 text-zinc-900" : "text-zinc-400 hover:text-zinc-700")
              }
            >
              All
            </button>
            {types.map((t) => (
              <button
                key={t}
                onClick={() => setParam("type", t)}
                className={
                  "text-[10px] font-medium uppercase tracking-wider px-2 py-1 rounded " +
                  (type === t ? "bg-zinc-100 text-zinc-900" : "text-zinc-400 hover:text-zinc-700")
                }
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <Panel>
          <ul className="divide-y divide-zinc-950/5">
            {filtered.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/reports/${r.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-50 transition-colors group"
                >
                  <div className="size-10 rounded-md bg-zinc-100 flex items-center justify-center">
                    <FileText className="size-4 text-zinc-500" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium group-hover:text-brand transition-colors">
                      {r.name}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {r.type} · {r.author} · updated {r.updated}
                    </p>
                  </div>
                  <span className="text-xs font-mono text-zinc-400 tabular-nums">{r.size}</span>
                </Link>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-6 py-12 text-center text-sm text-zinc-500">
                No reports match your filters.
              </li>
            )}
          </ul>
        </Panel>
      </div>
    </>
  );
}
