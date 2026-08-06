"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel } from "@/components/dashboard/Panel";
import { compactCurrency } from "@/lib/formatters";
import { MapPin } from "lucide-react";

const REGIONS = ["All", "North America", "Europe", "APAC", "LATAM"];

export function BranchesClient() {
  const [region, setRegion] = useState("All");
  const { data: stores = [] } = useQuery({ queryKey: ["stores", region], queryFn: () => api.getStores({ region: region === "All" ? undefined : region }) });
  const { data: summary } = useQuery({ queryKey: ["branch-summary"], queryFn: api.getBranchSummary });

  return (
    <>
      <PageHeader title="Branch Performance" subtitle="All retail stores across 8 countries" />
      <div className="px-8 py-6 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: "Total Stores", value: summary ? String(summary.total_stores) : "—" },
            { label: "Countries", value: summary ? String(summary.countries) : "—" },
            { label: "Total Revenue", value: summary ? compactCurrency(summary.total_revenue) : "—" },
            { label: "Avg Attainment", value: summary ? `${summary.avg_attainment}%` : "—" },
            { label: "Top Store", value: summary?.top_store ?? "—" },
          ].map((s) => (
            <div key={s.label} className="bg-surface ring-1 ring-black/5 rounded-xl p-4">
              <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{s.label}</p>
              <p className="text-lg font-semibold mt-1 text-zinc-900 truncate">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-1">
          {REGIONS.map((r) => (
            <button key={r} onClick={() => setRegion(r)}
              className={`text-[10px] font-medium uppercase tracking-wider px-3 py-1.5 rounded-md transition-colors ${region === r ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"}`}>
              {r}
            </button>
          ))}
        </div>

        {/* Stores table */}
        <Panel>
          <table className="w-full text-left">
            <thead className="bg-zinc-50 border-b border-zinc-950/5">
              <tr>
                {["Store", "Country", "Manager", "Staff", "Target", "Revenue", "Attainment", "NPS"].map((h, i) => (
                  <th key={h} className={`px-5 py-3 text-[10px] font-medium text-zinc-400 uppercase tracking-wider${i >= 3 ? " text-right" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-950/5">
              {stores.map((s) => (
                <tr key={s.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="size-7 bg-brand/10 rounded-md flex items-center justify-center"><MapPin className="size-3.5 text-brand" /></div>
                      <div>
                        <p className="text-sm font-medium">{s.name}</p>
                        <p className="text-xs font-mono text-zinc-400">{s.code} · {s.city}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-zinc-600">{s.country}</td>
                  <td className="px-5 py-4 text-sm text-zinc-600">{s.manager}</td>
                  <td className="px-5 py-4 text-sm font-mono tabular-nums text-right text-zinc-600">{s.staff_count}</td>
                  <td className="px-5 py-4 text-sm font-mono tabular-nums text-right text-zinc-500">{compactCurrency(s.annual_target)}</td>
                  <td className="px-5 py-4 text-sm font-mono tabular-nums text-right text-zinc-900 font-semibold">{compactCurrency(s.annual_revenue)}</td>
                  <td className="px-5 py-4 text-right">
                    <span className={`text-xs font-semibold font-mono tabular-nums ${s.attainment_pct >= 100 ? "text-emerald-600" : s.attainment_pct >= 90 ? "text-amber-600" : "text-rose-600"}`}>
                      {s.attainment_pct}%
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm font-mono tabular-nums text-right">
                    <span className={`font-semibold ${s.nps_score >= 75 ? "text-emerald-600" : s.nps_score >= 60 ? "text-amber-600" : "text-rose-600"}`}>{s.nps_score}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </>
  );
}
