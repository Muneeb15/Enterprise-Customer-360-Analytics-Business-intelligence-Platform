"use client";

import { useState } from "react";
import Link from "next/link";
import type { Kpi, Region, Segment, RevenuePoint, Customer } from "@/lib/api";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Panel } from "@/components/dashboard/Panel";
import { RevenueTrendChart } from "@/components/charts/RevenueTrendChart";
import { SegmentBars } from "@/components/charts/SegmentBars";
import { CustomerTable } from "@/components/tables/CustomerTable";
import { compactCurrency } from "@/lib/formatters";

const PERIODS = [
  { label: "12M", months: 12 },
  { label: "6M",  months: 6  },
  { label: "QTD", months: 3  },
] as const;

interface Props {
  kpis: Kpi[];
  regions: Region[];
  segments: Segment[];
  revenueSeries: RevenuePoint[];
  customers: Customer[];
}

export function OverviewClient({ kpis, regions, segments, revenueSeries, customers }: Props) {
  const [period, setPeriod] = useState<"12M" | "6M" | "QTD">("12M");
  const months = PERIODS.find((p) => p.label === period)?.months ?? 12;

  return (
    <>
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel
          title="Revenue Trend"
          className="lg:col-span-2"
          action={
            <div className="flex gap-1">
              {PERIODS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setPeriod(p.label)}
                  className={
                    "text-[10px] font-medium uppercase tracking-wider px-2 py-1 rounded transition-colors " +
                    (period === p.label
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100")
                  }
                >
                  {p.label}
                </button>
              ))}
            </div>
          }
          bodyClassName="p-2"
        >
          <RevenueTrendChart data={revenueSeries} months={months} />
        </Panel>

        <Panel title="Top Segments">
          <SegmentBars segments={segments} />
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="Regional Performance" className="lg:col-span-1">
          <div className="p-6 space-y-4">
            {regions.map((r) => (
              <div key={r.name}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-zinc-700">{r.name}</span>
                  <span className="font-mono text-zinc-500 tabular-nums">{compactCurrency(r.revenue)}</span>
                </div>
                <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand rounded-full"
                    style={{ width: `${r.share}%`, opacity: 0.2 + (r.share / 100) * 0.8 }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Key Insights" className="lg:col-span-2">
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Growth Signal", body: "Enterprise Growth segment expanded 22% QoQ, driving 42% of total revenue.", tone: "pos" as const },
              { label: "Watch",         body: "SMB High Churn cohort recency slipped to 18 days avg. Retention play recommended.", tone: "neg" as const },
              { label: "Regional",      body: "APAC premium upgrades up 22% over 14 days — capacity plan for Q1.", tone: "pos" as const },
              { label: "Ops",           body: "AOV flat at $1,514 — pricing test scheduled for W3 January.", tone: "neutral" as const },
            ].map((ins) => {
              const dot = ins.tone === "pos" ? "bg-emerald-500" : ins.tone === "neg" ? "bg-rose-500" : "bg-zinc-300";
              return (
                <div key={ins.label} className="flex gap-3">
                  <div className={`size-1.5 rounded-full mt-1.5 shrink-0 ${dot}`} />
                  <div>
                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">{ins.label}</p>
                    <p className="text-sm text-zinc-700 mt-0.5 leading-relaxed">{ins.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <Panel
        title="High-Value Customers"
        action={
          <Link href="/customers" className="text-xs font-medium text-brand hover:underline">
            Open explorer →
          </Link>
        }
      >
        <CustomerTable customers={customers} limit={5} />
      </Panel>
    </>
  );
}
