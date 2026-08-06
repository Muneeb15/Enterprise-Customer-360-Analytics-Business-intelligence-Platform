"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AlertTriangle } from "lucide-react";
import { compactCurrency } from "@/lib/formatters";
import { OverviewClient } from "./OverviewClient";
import { PageSkeleton } from "@/components/dashboard/PageSkeleton";

export function OverviewDynamic() {
  // All queries fire in parallel — first cached result renders immediately
  const { data: kpis = [], isLoading: kLoading } = useQuery({
    queryKey: ["kpis"], queryFn: api.getKpis, staleTime: 30_000,
  });
  const { data: regions = [] } = useQuery({
    queryKey: ["regions"], queryFn: api.getRegions, staleTime: 60_000,
  });
  const { data: segments = [] } = useQuery({
    queryKey: ["segments"], queryFn: api.getSegments, staleTime: 60_000,
  });
  const { data: revenueSeries = [] } = useQuery({
    queryKey: ["revenue-series"], queryFn: api.getRevenueSeries, staleTime: 60_000,
  });
  const { data: customers = [] } = useQuery({
    queryKey: ["customers-all"],
    queryFn: () => api.getAllCustomers(),
    staleTime: 30_000,
  });
  const { data: anomalies = [] } = useQuery({
    queryKey: ["anomalies"], queryFn: api.getAnomalies,
    staleTime: 120_000,
    retry: false,
  });

  // Show skeleton until KPIs arrive (usually < 300ms after cache warms)
  if (kLoading && kpis.length === 0) {
    return <PageSkeleton kpis rows={5} />;
  }

  return (
    <>
      <div className="px-8 pt-8 pb-2">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Executive Overview</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Live · updated 2m ago</p>
      </div>

      <div className="px-8 pb-10 space-y-6">
        {/* Anomaly alerts */}
        {anomalies.length > 0 && (
          <div className="space-y-2">
            {anomalies.map((a, i) => (
              <div key={i} className={`flex items-start gap-3 px-4 py-2.5 rounded-lg ring-1 text-xs ${
                a.severity === "critical"
                  ? "bg-rose-50 ring-rose-200 text-rose-800"
                  : "bg-amber-50 ring-amber-200 text-amber-800"
              }`}>
                <AlertTriangle className="size-3.5 mt-0.5 shrink-0" />
                <span>
                  <span className="font-semibold">
                    {a.severity === "critical" ? "Critical anomaly" : "Anomaly"} detected
                  </span>
                  {" "}— Month {a.month_index + 1}: revenue {a.direction === "high" ? "spike" : "dip"}{" "}
                  (z-score {a.z_score}). Expected{" "}
                  <span className="font-mono">{compactCurrency(a.expected)}</span>, got{" "}
                  <span className="font-mono">{compactCurrency(a.value)}</span>.{" "}
                  <Link href="/data-science" className="underline hover:no-underline">
                    View predictions →
                  </Link>
                </span>
              </div>
            ))}
          </div>
        )}

        <OverviewClient
          kpis={kpis}
          regions={regions}
          segments={segments}
          revenueSeries={revenueSeries}
          customers={customers}
        />
      </div>
    </>
  );
}
