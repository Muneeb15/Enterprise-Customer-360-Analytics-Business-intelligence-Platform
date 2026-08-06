"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Panel } from "@/components/dashboard/Panel";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { RevenueTrendChart } from "@/components/charts/RevenueTrendChart";
import { compactCurrency } from "@/lib/formatters";

const PERIODS = ["QTD", "6M", "12M", "FY", "YTD"] as const;

// Months to slice for each period
const PERIOD_MONTHS: Record<string, number> = {
  QTD: 3, "6M": 6, "12M": 12, FY: 12, YTD: new Date().getMonth() + 1,
};

export function SalesClient() {
  const sp = useSearchParams();
  const router = useRouter();

  const period = (PERIODS.includes(sp.get("period") as (typeof PERIODS)[number])
    ? sp.get("period")
    : "12M") as string;
  const from = sp.get("from") ?? "";
  const to = sp.get("to") ?? "";

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(sp.toString());
    value ? next.set(key, value) : next.delete(key);
    router.push(`?${next.toString()}`, { scroll: false });
  }

  const { data: allCategoryRevenue = [] } = useQuery({ queryKey: ["category-revenue"], queryFn: api.getCategoryRevenue });
  const { data: regions = [] } = useQuery({ queryKey: ["regions"], queryFn: api.getRegions });
  const { data: heatmap = [] } = useQuery({ queryKey: ["seasonal-heatmap"], queryFn: api.getSeasonalHeatmap });
  const { data: kpis = [] } = useQuery({ queryKey: ["kpis"], queryFn: api.getKpis });
  const { data: allRevenueSeries = [] } = useQuery({ queryKey: ["revenue-series"], queryFn: api.getRevenueSeries });

  // Filter revenue series by selected period
  const monthCount = PERIOD_MONTHS[period] ?? 12;
  const revenueSeries = allRevenueSeries.slice(-monthCount);

  const totalCat = allCategoryRevenue.reduce((a, c) => a + c.value, 0);
  const maxIntensity = 100;

  // Derive sales-specific KPIs from the KPI array
  const totalRevenue = kpis.find((k) => k.label === "Total Revenue");
  const activeCustomers = kpis.find((k) => k.label === "Active Customers");
  const churnRate = kpis.find((k) => k.label === "Churn Rate");
  const aov = kpis.find((k) => k.label === "AOV");

  return (
    <>
      <div className="px-8 pt-8 pb-2 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Sales Analytics</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Period · {period}
            {from && to ? ` · ${from} → ${to}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-1 ring-1 ring-black/5 bg-surface rounded-md p-0.5">
          {PERIODS.map((p) => (
            <button key={p} onClick={() => setParam("period", p)}
              className={"text-[10px] font-medium uppercase tracking-wider px-2 py-1 rounded " +
                (period === p ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-900")}>
              {p}
            </button>
          ))}
          <div className="flex items-center gap-1 pl-2 border-l border-black/5 ml-1">
            <input type="date" value={from} onChange={(e) => setParam("from", e.target.value)}
              className="text-[10px] font-mono bg-transparent focus:outline-none text-zinc-600" />
            <span className="text-zinc-300 text-[10px]">→</span>
            <input type="date" value={to} onChange={(e) => setParam("to", e.target.value)}
              className="text-[10px] font-mono bg-transparent focus:outline-none text-zinc-600" />
          </div>
        </div>
      </div>

      <div className="px-8 pb-10 space-y-6">
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {totalRevenue && <KpiCard label={totalRevenue.label} value={totalRevenue.value} delta={totalRevenue.delta} tone={totalRevenue.tone} hero />}
          {activeCustomers && <KpiCard label={activeCustomers.label} value={activeCustomers.value} delta={activeCustomers.delta} tone={activeCustomers.tone} />}
          {churnRate && <KpiCard label={churnRate.label} value={churnRate.value} delta={churnRate.delta} tone={churnRate.tone} />}
          {aov && <KpiCard label={aov.label} value={aov.value} delta={aov.delta} tone={aov.tone} />}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Panel title={`Revenue Trend · ${period}`} className="lg:col-span-2" bodyClassName="p-2">
            <RevenueTrendChart data={revenueSeries} />
          </Panel>
          <Panel title="Revenue by Category" bodyClassName="p-6">
            <div className="space-y-4">
              {allCategoryRevenue.map((c) => (
                <div key={c.name}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-zinc-700">{c.name}</span>
                    <span className="font-mono text-zinc-500 tabular-nums">{compactCurrency(c.value)}</span>
                  </div>
                  <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand rounded-full" style={{ width: `${totalCat ? (c.value / totalCat) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {heatmap.length > 0 && (
          <Panel title="Seasonal Heatmap · Weekly Revenue Index" bodyClassName="p-6">
            <div className="space-y-1">
              <div className="grid grid-cols-[3rem_repeat(12,1fr)] gap-1 text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-2">
                <div />
                {heatmap[0].values.map((v) => <div key={v.month} className="text-center">{v.month}</div>)}
              </div>
              {heatmap.map((row) => (
                <div key={row.week} className="grid grid-cols-[3rem_repeat(12,1fr)] gap-1">
                  <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center">{row.week}</div>
                  {row.values.map((v) => (
                    <div key={v.month} className="aspect-square rounded-sm"
                      style={{ background: `color-mix(in oklab, var(--brand) ${(v.intensity / maxIntensity) * 100}%, #f4f4f5)` }}
                      title={`${row.week} ${v.month}: ${v.intensity}`} />
                  ))}
                </div>
              ))}
            </div>
          </Panel>
        )}

        <Panel title="Regional Breakdown">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 border-b border-zinc-950/5">
              <tr>
                {["Region", "Share", "Revenue"].map((h, i) => (
                  <th key={h} className={`px-6 py-3 text-[10px] font-medium text-zinc-400 uppercase tracking-wider${i > 0 ? " text-right" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-950/5">
              {regions.map((r) => (
                <tr key={r.name} className="hover:bg-zinc-50">
                  <td className="px-6 py-3.5 text-sm font-medium">{r.name}</td>
                  <td className="px-6 py-3.5 text-sm text-right font-mono tabular-nums text-zinc-600">{r.share}%</td>
                  <td className="px-6 py-3.5 text-sm text-right font-mono tabular-nums text-zinc-900">{compactCurrency(r.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </>
  );
}
