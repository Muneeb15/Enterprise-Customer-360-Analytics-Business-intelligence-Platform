"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel } from "@/components/dashboard/Panel";
import { compactCurrency } from "@/lib/formatters";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from "recharts";
import { AlertTriangle, TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = ["Forecasting", "EDA", "Anomalies", "Correlations"] as const;
type Tab = (typeof TABS)[number];

export function DataScienceClient() {
  const [tab, setTab] = useState<Tab>("Forecasting");

  const { data: forecast = [] } = useQuery({ queryKey: ["forecast"], queryFn: () => api.getForecast(3) });
  const { data: eda } = useQuery({ queryKey: ["eda"], queryFn: api.getEDA });
  const { data: anomalies = [] } = useQuery({ queryKey: ["anomalies"], queryFn: api.getAnomalies });
  const { data: correlations = [] } = useQuery({ queryKey: ["correlations"], queryFn: api.getCorrelations });

  return (
    <>
      <PageHeader
        title="Future Predictions"
        subtitle="EDA · Forecasting · Anomaly Detection · Statistical Analysis"
      />

      {/* Tabs */}
      <div className="px-8 pt-4">
        <div className="flex gap-1 border-b border-zinc-950/5">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-4 py-2 text-sm border-b-2 -mb-px transition-colors",
                tab === t
                  ? "border-brand text-zinc-900 font-medium"
                  : "border-transparent text-zinc-500 hover:text-zinc-900",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="px-8 py-6 space-y-6">
        {/* ── Forecasting ───────────────────────────────────────────────── */}
        {tab === "Forecasting" && (
          <>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Next Month Forecast", value: forecast.find(f => f.actual === null)?.forecast ?? 0, note: "Exponential smoothing" },
                { label: "Trend Direction", value: eda?.trend.direction === "up" ? "↑ Upward" : eda?.trend.direction === "down" ? "↓ Downward" : "→ Flat", note: `R² = ${eda?.trend.r_squared ?? 0}` },
                { label: "MoM Growth (Last)", value: eda?.trend.growth_rates?.at(-1) ? `${(eda.trend.growth_rates.at(-1)! as number) > 0 ? "+" : ""}${eda.trend.growth_rates.at(-1)}%` : "—", note: "Month over month" },
              ].map((s) => (
                <div key={s.label} className="bg-surface ring-1 ring-black/5 rounded-xl p-5">
                  <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{s.label}</p>
                  <p className="text-2xl font-mono font-semibold mt-1.5 text-zinc-900">
                    {typeof s.value === "number" ? compactCurrency(s.value) : s.value}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">{s.note}</p>
                </div>
              ))}
            </div>

            <Panel title="Revenue Forecast — 12 months historical + 3 months projected" bodyClassName="p-4">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={forecast} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fcast" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="conf" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.08} />
                        <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(0,0,0,0.05)" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#71717a" }} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => compactCurrency(v)} width={60} tick={{ fontSize: 11, fill: "#a1a1aa" }} />
                    <Tooltip
                      contentStyle={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 8, fontSize: 12 }}
                      formatter={(v: number, name: string) => [compactCurrency(v), name]}
                    />
                    <Area type="monotone" dataKey="upper" stroke="transparent" fill="url(#conf)" />
                    <Area type="monotone" dataKey="lower" stroke="transparent" fill="white" />
                    <Area type="monotone" dataKey="actual" stroke="var(--brand)" strokeWidth={2} fill="url(#fcast)" connectNulls={false} dot={false} name="Actual" />
                    <Area type="monotone" dataKey="forecast" stroke="var(--brand)" strokeWidth={2} strokeDasharray="5 3" fill="transparent" connectNulls dot={false} name="Forecast" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-6 mt-3 px-2">
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <div className="w-8 h-0.5 bg-brand rounded" />
                  Actual Revenue
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <div className="w-8 h-0.5 bg-brand rounded" style={{ backgroundImage: "repeating-linear-gradient(90deg,var(--brand) 0,var(--brand) 4px,transparent 4px,transparent 8px)" }} />
                  Forecast
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <div className="w-8 h-3 bg-brand/10 rounded" />
                  Confidence Band
                </div>
              </div>
            </Panel>

            {eda && (
              <Panel title="Month-over-Month Growth Rate" bodyClassName="p-4">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={eda.trend.growth_rates.map((g, i) => ({ month: `M${i + 1}`, growth: g }))} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="rgba(0,0,0,0.05)" vertical={false} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#a1a1aa" }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#a1a1aa" }} tickFormatter={(v) => `${v}%`} />
                      <Tooltip formatter={(v: number) => [`${v}%`, "Growth"]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Bar dataKey="growth" fill="var(--brand)" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
            )}
          </>
        )}

        {/* ── EDA ──────────────────────────────────────────────────────── */}
        {tab === "EDA" && eda && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {eda.stats.map((s) => (
                <Panel key={s.metric} title={s.metric} bodyClassName="p-5">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ["Count", s.count.toLocaleString()],
                      ["Mean", compactCurrency(s.mean)],
                      ["Median", compactCurrency(s.median)],
                      ["Std Dev", compactCurrency(s.std)],
                      ["Min", compactCurrency(s.min)],
                      ["Max", compactCurrency(s.max)],
                      ["Q1", compactCurrency(s.q1)],
                      ["Q3", compactCurrency(s.q3)],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">{label}</p>
                        <p className="text-sm font-mono font-semibold text-zinc-800 mt-0.5">{value}</p>
                      </div>
                    ))}
                  </div>
                </Panel>
              ))}
            </div>

            <Panel title="Trend Analysis" bodyClassName="p-6">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Direction</p>
                  <div className={cn("text-lg font-semibold inline-flex items-center gap-2",
                    eda.trend.direction === "up" ? "text-emerald-600" : eda.trend.direction === "down" ? "text-rose-600" : "text-zinc-500")}>
                    {eda.trend.direction === "up" ? <TrendingUp className="size-5" /> : eda.trend.direction === "down" ? <TrendingDown className="size-5" /> : <Minus className="size-5" />}
                    {eda.trend.direction === "up" ? "Upward" : eda.trend.direction === "down" ? "Downward" : "Flat"}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Slope (per period)</p>
                  <p className="text-lg font-mono font-semibold text-zinc-800">{compactCurrency(eda.trend.slope)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">R² (fit quality)</p>
                  <p className="text-lg font-mono font-semibold text-zinc-800">{eda.trend.r_squared}</p>
                </div>
              </div>
            </Panel>
          </>
        )}

        {/* ── Anomalies ─────────────────────────────────────────────────── */}
        {tab === "Anomalies" && (
          <Panel title="Detected Anomalies">
            {anomalies.length === 0 ? (
              <div className="flex flex-col items-center py-16 gap-3">
                <Activity className="size-8 text-zinc-300" />
                <p className="text-sm font-medium text-zinc-500">No anomalies detected</p>
                <p className="text-xs text-zinc-400">All revenue data points are within normal range (±2σ)</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-950/5">
                {anomalies.map((a, i) => (
                  <div key={i} className={cn("px-6 py-4 flex items-start gap-4", a.severity === "critical" ? "bg-rose-50/50" : "bg-amber-50/50")}>
                    <AlertTriangle className={cn("size-5 mt-0.5 shrink-0", a.severity === "critical" ? "text-rose-600" : "text-amber-500")} />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1",
                          a.severity === "critical" ? "bg-rose-50 text-rose-700 ring-rose-200" : "bg-amber-50 text-amber-700 ring-amber-200")}>
                          {a.severity.toUpperCase()}
                        </span>
                        <span className="text-xs text-zinc-500">Month {a.month_index + 1} · {a.direction === "high" ? "Above" : "Below"} expected</span>
                      </div>
                      <p className="text-sm text-zinc-800">
                        Actual: <span className="font-mono font-semibold">{compactCurrency(a.value)}</span>
                        {" "}vs expected: <span className="font-mono font-semibold">{compactCurrency(a.expected)}</span>
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">Z-score: {a.z_score} standard deviations from mean</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        )}

        {/* ── Correlations ──────────────────────────────────────────────── */}
        {tab === "Correlations" && (
          <Panel title="Metric Correlations" bodyClassName="p-6">
            <div className="space-y-4">
              {correlations.map((c, i) => {
                const abs = Math.abs(c.coefficient);
                const bar = abs * 100;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-zinc-700 font-medium">{c.metric_a} ↔ {c.metric_b}</span>
                      <div className="flex gap-3 font-mono tabular-nums">
                        <span className={c.coefficient >= 0 ? "text-emerald-600" : "text-rose-600"}>
                          {c.coefficient >= 0 ? "+" : ""}{c.coefficient}
                        </span>
                        <span className={cn("text-[10px] font-semibold",
                          c.strength === "strong" ? "text-emerald-600" :
                          c.strength === "moderate" ? "text-amber-600" : "text-zinc-400")}>
                          {c.strength}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500",
                          c.coefficient >= 0 ? "bg-emerald-500" : "bg-rose-500")}
                        style={{ width: `${bar}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-zinc-400 mt-6">
              Pearson correlation coefficient. Range: −1 (perfect negative) to +1 (perfect positive). |r| ≥ 0.7 = strong, 0.4–0.7 = moderate, 0.2–0.4 = weak.
            </p>
          </Panel>
        )}
      </div>
    </>
  );
}
