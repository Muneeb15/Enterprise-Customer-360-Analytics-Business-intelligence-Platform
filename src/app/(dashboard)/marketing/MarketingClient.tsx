"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Panel } from "@/components/dashboard/Panel";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { compactCurrency, number, currency } from "@/lib/formatters";

const CHANNELS = ["All", "Sales", "Paid Search", "Lifecycle", "Content"] as const;

export function MarketingClient() {
  const sp = useSearchParams();
  const router = useRouter();

  const period = sp.get("period") ?? "90d";
  const channel = sp.get("channel") ?? "All";
  const from = sp.get("from") ?? "";
  const to = sp.get("to") ?? "";

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(sp.toString());
    value ? next.set(key, value) : next.delete(key);
    router.push(`?${next.toString()}`, { scroll: false });
  }

  const { data: funnel = [] } = useQuery({ queryKey: ["funnel"], queryFn: api.getFunnel });
  const { data: campaigns = [] } = useQuery({
    queryKey: ["campaigns", channel],
    queryFn: () => api.getCampaigns(channel),
  });
  const { data: ca } = useQuery({
    queryKey: ["customer-analytics"],
    queryFn: api.getCustomerAnalytics,
  });

  // Derive marketing KPIs from real data
  const totalSpend = campaigns.reduce((a, c) => a + c.spend, 0);
  const totalRevenue = campaigns.reduce((a, c) => a + c.revenue, 0);
  const blendedRoas = totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : "—";
  const blendedCac = campaigns.length > 0
    ? Math.round(campaigns.reduce((a, c) => a + c.cac, 0) / campaigns.length)
    : 0;
  const conversionRate = funnel.length >= 2
    ? ((funnel[funnel.length - 1].value / funnel[0].value) * 100).toFixed(2)
    : "—";

  const top = funnel[0]?.value ?? 1;

  return (
    <>
      <div className="px-8 pt-8 pb-2 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Marketing Analytics</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Attribution · {period}
            {from && to ? ` · ${from} → ${to}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-1 ring-1 ring-black/5 bg-surface rounded-md p-0.5">
          {(["30d", "90d", "12M"] as const).map((p) => (
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
          <KpiCard label="Blended CAC" value={blendedCac ? `$${blendedCac.toLocaleString()}` : "—"} delta="-8.4%" tone="pos" hero />
          <KpiCard label="Blended ROAS" value={blendedRoas !== "—" ? `${blendedRoas}x` : "—"} delta="+0.6x" tone="pos" />
          <KpiCard label="Total Ad Spend" value={compactCurrency(totalSpend)} delta="" tone="neutral" />
          <KpiCard label="Conversion Rate" value={conversionRate !== "—" ? `${conversionRate}%` : "—"} delta="-0.1%" tone="neg" />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Panel title="Acquisition Funnel" className="lg:col-span-2" bodyClassName="p-6">
            <div className="space-y-3">
              {funnel.map((stage, i) => {
                const pct = (stage.value / top) * 100;
                const conv = i === 0 ? null : ((stage.value / funnel[i - 1].value) * 100).toFixed(1);
                return (
                  <div key={stage.stage}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-700 font-medium">{stage.stage}</span>
                      <div className="flex gap-4 font-mono tabular-nums">
                        <span className="text-zinc-500">{number(stage.value)}</span>
                        {conv && <span className="text-zinc-400 w-14 text-right">{conv}%</span>}
                      </div>
                    </div>
                    <div className="h-8 bg-zinc-100 rounded-md overflow-hidden">
                      <div className="h-full flex items-center justify-end px-3"
                        style={{ width: `${pct}%`, background: `color-mix(in oklab, var(--brand) ${100 - i * 12}%, #d4d4d8)` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title="CAC Trend · Rolling 12w" bodyClassName="p-6">
            <div className="flex items-end gap-1 h-40">
              {[520, 490, 510, 470, 460, 445, 430, 425, 440, 420, 415, blendedCac || 412].map((v, i) => (
                <div key={i} className="flex-1 bg-brand/70 rounded-sm transition-all"
                  style={{ height: `${(v / 550) * 100}%` }} title={`Week ${i + 1}: $${v}`} />
              ))}
            </div>
            <p className="text-xs text-zinc-500 mt-4">
              Current: <span className="font-mono font-semibold text-zinc-800">${blendedCac || 412}</span> avg CAC
            </p>
          </Panel>
        </div>

        <Panel
          title="Campaign Performance"
          action={
            <div className="flex gap-1">
              {CHANNELS.map((c) => (
                <button key={c} onClick={() => setParam("channel", c)}
                  className={"text-[10px] font-medium uppercase tracking-wider px-2 py-1 rounded " +
                    (channel === c ? "bg-zinc-100 text-zinc-900" : "text-zinc-400 hover:text-zinc-700")}>
                  {c}
                </button>
              ))}
            </div>
          }
        >
          <table className="w-full text-left">
            <thead className="bg-zinc-50 border-b border-zinc-950/5">
              <tr>
                {["Campaign", "Channel", "Spend", "Revenue", "ROAS", "CAC"].map((h, i) => (
                  <th key={h} className={`px-6 py-3 text-[10px] font-medium text-zinc-400 uppercase tracking-wider${i >= 2 ? " text-right" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-950/5">
              {campaigns.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-50">
                  <td className="px-6 py-3.5 text-sm font-medium">{c.name}</td>
                  <td className="px-6 py-3.5 text-sm text-zinc-600">{c.channel}</td>
                  <td className="px-6 py-3.5 text-sm font-mono text-right tabular-nums text-zinc-600">{compactCurrency(c.spend)}</td>
                  <td className="px-6 py-3.5 text-sm font-mono text-right tabular-nums text-zinc-900">{compactCurrency(c.revenue)}</td>
                  <td className="px-6 py-3.5 text-sm font-mono text-right tabular-nums">
                    <span className={c.roas >= 5 ? "text-emerald-600" : c.roas >= 3 ? "text-zinc-700" : "text-rose-600"}>
                      {c.roas.toFixed(2)}x
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-sm font-mono text-right tabular-nums text-zinc-600">{currency(c.cac)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </>
  );
}
