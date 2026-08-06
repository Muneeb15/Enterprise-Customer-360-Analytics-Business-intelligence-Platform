"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel } from "@/components/dashboard/Panel";
import { compactCurrency } from "@/lib/formatters";
import { Users, TrendingDown, RefreshCw, ShoppingCart } from "lucide-react";

const PIE_COLORS = ["#10b981", "#f59e0b", "#ef4444"];

export function CustomerAnalyticsClient() {
  const { data: ca } = useQuery({
    queryKey: ["customer-analytics"],
    queryFn: api.getCustomerAnalytics,
    refetchInterval: 30_000,
  });

  const kpis = ca
    ? [
        { label: "Total Customers",       value: ca.total_customers.toLocaleString(),       icon: Users,        color: "text-brand" },
        { label: "Churn Rate",            value: `${ca.churn_rate_pct}%`,                  icon: TrendingDown,  color: ca.churn_rate_pct > 5 ? "text-rose-600" : "text-emerald-600" },
        { label: "Retention Rate",        value: `${ca.retention_rate_pct}%`,              icon: RefreshCw,     color: "text-emerald-600" },
        { label: "Repeat Purchase Rate",  value: `${ca.repeat_purchase_rate_pct}%`,         icon: ShoppingCart,  color: "text-violet-600" },
        { label: "Avg LTV",               value: compactCurrency(ca.avg_ltv),              icon: Users,        color: "text-brand" },
        { label: "AOV",                   value: compactCurrency(ca.aov),                  icon: ShoppingCart,  color: "text-amber-600" },
        { label: "Total MRR",             value: compactCurrency(ca.total_mrr),            icon: Users,        color: "text-emerald-600" },
        { label: "At-Risk Customers",     value: ca.at_risk_customers.toLocaleString(),    icon: TrendingDown,  color: "text-amber-600" },
      ]
    : [];

  const pieData = ca
    ? [
        { name: "Active",   value: ca.active_customers },
        { name: "At Risk",  value: ca.at_risk_customers },
        { name: "Churned",  value: ca.churned_customers },
      ]
    : [];

  const growthData = ca
    ? ca.growth_labels.map((label, i) => ({ label, customers: ca.monthly_growth[i] ?? 0 }))
    : [];

  return (
    <>
      <PageHeader title="Customer Analytics" subtitle="CLV, churn, retention, and growth metrics" />

      <div className="px-8 py-6 space-y-6">
        {/* KPI grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map((k) => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="bg-surface ring-1 ring-black/5 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{k.label}</p>
                  <Icon className={`size-4 ${k.color}`} strokeWidth={1.75} />
                </div>
                <p className={`text-2xl font-mono font-semibold tabular-nums ${k.color}`}>{k.value}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Growth trend */}
          <Panel title="Customer Growth — Last 6 Months" className="lg:col-span-2" bodyClassName="p-4">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(0,0,0,0.05)" vertical={false} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#71717a" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#a1a1aa" }} tickFormatter={(v) => v.toLocaleString()} />
                  <Tooltip formatter={(v: number) => [v.toLocaleString(), "Customers"]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Area type="monotone" dataKey="customers" stroke="var(--brand)" strokeWidth={2} fill="url(#cg)" dot={{ r: 3, fill: "var(--brand)" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          {/* Customer status breakdown */}
          <Panel title="Status Distribution" bodyClassName="p-4">
            <div className="h-44 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number, name: string) => [v.toLocaleString(), name]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-2 mt-2">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                    <span className="text-zinc-600">{d.name}</span>
                  </div>
                  <span className="font-mono font-semibold text-zinc-800">{d.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* Churn vs Retention bars */}
        <Panel title="Churn vs Retention Overview" bodyClassName="p-6">
          <div className="grid grid-cols-2 gap-8">
            {[
              { label: "Retention Rate", value: ca?.retention_rate_pct ?? 0, color: "#10b981", bg: "bg-emerald-50" },
              { label: "Churn Rate",     value: ca?.churn_rate_pct ?? 0,     color: "#ef4444", bg: "bg-rose-50" },
              { label: "Repeat Purchase",value: ca?.repeat_purchase_rate_pct ?? 0, color: "var(--brand)", bg: "bg-brand/5" },
              { label: "Active Share",   value: ca ? Math.round(ca.active_customers / ca.total_customers * 100) : 0, color: "#8b5cf6", bg: "bg-violet-50" },
            ].map((m) => (
              <div key={m.label} className={`${m.bg} rounded-xl p-4`}>
                <p className="text-xs font-medium text-zinc-600 mb-2">{m.label}</p>
                <div className="flex items-end gap-3">
                  <p className="text-3xl font-mono font-bold tabular-nums" style={{ color: m.color }}>
                    {m.value}%
                  </p>
                </div>
                <div className="h-1.5 bg-white/60 rounded-full overflow-hidden mt-3">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${m.value}%`, background: m.color }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
