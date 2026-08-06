"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel } from "@/components/dashboard/Panel";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { RevenueTrendChart } from "@/components/charts/RevenueTrendChart";
import { SegmentBars } from "@/components/charts/SegmentBars";
import { KpiCardSkeleton, Skeleton } from "@/components/dashboard/Skeleton";
import { compactCurrency } from "@/lib/formatters";

export function AnalyticsClient() {
  const { data: kpis = [], isLoading: kLoading } = useQuery({
    queryKey: ["kpis"], queryFn: api.getKpis,
  });
  const { data: revSeries = [] } = useQuery({
    queryKey: ["revenue-series"], queryFn: api.getRevenueSeries,
  });
  const { data: segments = [] } = useQuery({
    queryKey: ["segments"], queryFn: api.getSegments,
  });
  const { data: regions = [] } = useQuery({
    queryKey: ["regions"], queryFn: api.getRegions,
  });
  const { data: catRevenue = [] } = useQuery({
    queryKey: ["category-revenue"], queryFn: api.getCategoryRevenue,
  });

  const totalCat = catRevenue.reduce((a, c) => a + c.value, 0);

  return (
    <>
      <PageHeader title="Analytics" subtitle="Full performance breakdown across all dimensions" />

      <div className="px-8 py-6 space-y-6">
        {/* KPIs */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kLoading
            ? Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)
            : kpis.map((k) => <KpiCard key={k.label} {...k} />)}
        </section>

        {/* Revenue trend + segments */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Panel title="Revenue Trend" className="lg:col-span-2" bodyClassName="p-2">
            <RevenueTrendChart data={revSeries} />
          </Panel>
          <Panel title="Customer Segments">
            <SegmentBars segments={segments} />
          </Panel>
        </div>

        {/* Category + Regional breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel title="Revenue by Category" bodyClassName="p-6">
            <div className="space-y-4">
              {catRevenue.map((c) => (
                <div key={c.name}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-zinc-700">{c.name}</span>
                    <span className="font-mono text-zinc-500 tabular-nums">
                      {compactCurrency(c.value)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand rounded-full transition-all duration-500"
                      style={{ width: `${totalCat ? (c.value / totalCat) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Regional Performance" bodyClassName="p-6">
            <div className="space-y-4">
              {regions.map((r) => (
                <div key={r.name}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-zinc-700">{r.name}</span>
                    <div className="flex gap-3 font-mono tabular-nums text-zinc-500">
                      <span>{r.share}%</span>
                      <span>{compactCurrency(r.revenue)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand rounded-full transition-all duration-500"
                      style={{ width: `${r.share}%`, opacity: 0.25 + (r.share / 100) * 0.75 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
