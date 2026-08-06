"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel } from "@/components/dashboard/Panel";
import { KpiCardSkeleton } from "@/components/dashboard/Skeleton";
import { compactCurrency } from "@/lib/formatters";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export function ProductsClient() {
  const { data: products = [], isLoading } = useQuery({ queryKey: ["products"], queryFn: api.getProducts });
  const { data: categories = [] } = useQuery({ queryKey: ["product-categories"], queryFn: api.getProductCategories });
  const { data: summary } = useQuery({ queryKey: ["product-summary"], queryFn: api.getProductSummary });

  return (
    <>
      <PageHeader title="Product Performance" subtitle="Revenue, units sold, and growth by product and category" />
      <div className="px-8 py-6 space-y-6">
        {/* Summary KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Products", value: summary ? String(summary.total_products) : "—", sub: "Active SKUs" },
            { label: "Total Revenue", value: summary ? compactCurrency(summary.total_revenue) : "—", sub: "All products" },
            { label: "Top Category", value: summary?.top_category ?? "—", sub: "By revenue" },
            { label: "Avg Growth", value: summary ? `${summary.avg_growth_pct > 0 ? "+" : ""}${summary.avg_growth_pct}%` : "—", sub: "Year over year" },
          ].map((s) => (
            <div key={s.label} className="bg-surface ring-1 ring-black/5 rounded-xl p-5">
              <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{s.label}</p>
              <p className="text-2xl font-mono font-semibold tabular-nums mt-1.5 text-zinc-900">{s.value}</p>
              <p className="text-xs text-zinc-400 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Product table */}
          <Panel title="All Products" className="lg:col-span-2">
            <table className="w-full text-left">
              <thead className="bg-zinc-50 border-b border-zinc-950/5">
                <tr>
                  {["Product", "Category", "Units Sold", "Revenue", "Growth", "Return Rate"].map((h, i) => (
                    <th key={h} className={`px-5 py-3 text-[10px] font-medium text-zinc-400 uppercase tracking-wider${i >= 2 ? " text-right" : ""}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-950/5">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-zinc-900">{p.name}</p>
                      <p className="text-xs font-mono text-zinc-400">{p.sku}</p>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-zinc-500">{p.category}</td>
                    <td className="px-5 py-3.5 text-sm font-mono tabular-nums text-right text-zinc-600">{p.units_sold.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-sm font-mono tabular-nums text-right text-zinc-900">{compactCurrency(p.revenue)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`inline-flex items-center gap-1 text-xs font-mono font-semibold ${p.growth_pct > 0 ? "text-emerald-600" : p.growth_pct < 0 ? "text-rose-600" : "text-zinc-400"}`}>
                        {p.growth_pct > 0 ? <TrendingUp className="size-3" /> : p.growth_pct < 0 ? <TrendingDown className="size-3" /> : <Minus className="size-3" />}
                        {p.growth_pct > 0 ? "+" : ""}{p.growth_pct}%
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-mono tabular-nums text-right text-zinc-500">{p.return_rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          {/* Category breakdown */}
          <Panel title="Category Breakdown" bodyClassName="p-6">
            <div className="space-y-4">
              {categories.map((c) => (
                <div key={c.category}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-zinc-700 font-medium">{c.category}</span>
                    <div className="flex gap-3 font-mono tabular-nums text-zinc-500">
                      <span>{c.share_pct}%</span>
                      <span className={c.growth_pct >= 0 ? "text-emerald-600" : "text-rose-600"}>
                        {c.growth_pct >= 0 ? "+" : ""}{c.growth_pct}%
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand rounded-full transition-all duration-500" style={{ width: `${c.share_pct}%` }} />
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1">{c.units_sold.toLocaleString()} units · {compactCurrency(c.revenue)}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
