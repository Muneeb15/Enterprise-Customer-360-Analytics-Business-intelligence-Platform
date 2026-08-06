"use client";

import { useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Customer } from "@/lib/api";
import { Panel } from "@/components/dashboard/Panel";
import { compactCurrency, number } from "@/lib/formatters";
import { downloadCSV, type CsvColumn } from "@/lib/csv";
import { CsvImportModal } from "@/components/csv-import/CsvImportModal";
import { AddCustomerModal } from "@/components/customers/AddCustomerModal";
import { Download, Search, Upload, Plus } from "lucide-react";
import {
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { cn } from "@/lib/utils";

const CUSTOMER_CSV_COLUMNS: CsvColumn<Customer>[] = [
  { header: "Customer", value: (c) => c.name },
  { header: "Segment", value: (c) => c.segment },
  { header: "Region", value: (c) => c.region },
  { header: "Status", value: (c) => c.status },
  { header: "MRR", value: (c) => c.mrr },
  { header: "LTV", value: (c) => c.ltv },
  { header: "Recency", value: (c) => c.recency },
  { header: "Frequency", value: (c) => c.frequency },
  { header: "Monetary", value: (c) => c.monetary },
  { header: "Joined", value: (c) => c.joined },
];

const statusStyle: Record<string, string> = {
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  "At Risk": "bg-amber-50 text-amber-700 ring-amber-600/10",
  Churned: "bg-zinc-100 text-zinc-500 ring-zinc-600/10",
};

export function CustomersClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const [importOpen, setImportOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const segment = sp.get("segment") ?? "";
  const q = sp.get("q") ?? "";
  const status = sp.get("status") ?? "";

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(sp.toString());
    value ? next.set(key, value) : next.delete(key);
    router.push(`?${next.toString()}`, { scroll: false });
  }

  const { data: customersPage, refetch: refetchCustomers } = useQuery({
    queryKey: ["customers", { segment, status }],
    queryFn: () => api.getCustomers({ segment: segment || undefined, status: status || undefined, page_size: 500 }),
  });
  const customers = useMemo(() => customersPage?.items ?? [], [customersPage]);

  const { data: segments = [] } = useQuery({
    queryKey: ["segments"],
    queryFn: api.getSegments,
  });

  const query = q.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      customers.filter((c) => {
        if (query && !c.name.toLowerCase().includes(query)) return false;
        return true;
      }),
    [customers, query],
  );

  const scatter = useMemo(
    () =>
      customers.map((c) => ({
        x: c.frequency,
        y: c.monetary,
        z: Math.max(4, c.ltv / 20_000),
        name: c.name,
        segment: c.segment,
      })),
    [customers],
  );

  return (
    <>
      <div className="px-8 pt-8 pb-2">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
          Customer Segmentation
        </h1>
        <p className="text-sm text-zinc-500 mt-0.5">RFM · {segments.length} personas</p>
      </div>

      <div className="px-8 pb-10 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <PersonaCard
            active={!segment}
            onClick={() => setParam("segment", "")}
            name="All Customers"
            count={customers.length}
            revenue={segments.reduce((a, s) => a + s.revenue, 0)}
          />
          {segments.map((s) => (
            <PersonaCard
              key={s.name}
              active={segment === s.name}
              onClick={() => setParam("segment", s.name === segment ? "" : s.name)}
              name={s.name}
              count={s.count}
              revenue={s.revenue}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400" />
            <input
              type="search"
              value={q}
              onChange={(e) => setParam("q", e.target.value)}
              placeholder="Search customers…"
              className="w-full text-sm bg-surface ring-1 ring-black/5 rounded-md pl-8 pr-3 py-1.5 focus:ring-brand/40 focus:outline-none"
            />
          </div>
          <span className="text-xs text-zinc-500 tabular-nums font-mono">
            {filtered.length} match{filtered.length === 1 ? "" : "es"}
          </span>
          <button
            onClick={() =>
              downloadCSV(
                `customers${segment ? "-" + segment.toLowerCase().replace(/\s+/g, "-") : ""}`,
                filtered,
                CUSTOMER_CSV_COLUMNS,
              )
            }
            className="ml-auto text-xs font-medium ring-1 ring-black/5 bg-surface py-1.5 px-3 rounded-md hover:bg-zinc-50 inline-flex items-center gap-1.5"
          >
            <Download className="size-3.5" /> Export CSV
          </button>
          <button
            onClick={() => setImportOpen(true)}
            className="text-xs font-medium ring-1 ring-brand bg-brand text-brand-foreground py-1.5 px-3 rounded-md hover:opacity-90 inline-flex items-center gap-1.5"
          >
            <Upload className="size-3.5" /> Import CSV
          </button>
          <button
            onClick={() => setAddOpen(true)}
            className="text-xs font-medium ring-1 ring-zinc-900 bg-zinc-900 text-white py-1.5 px-3 rounded-md hover:opacity-90 inline-flex items-center gap-1.5"
          >
            <Plus className="size-3.5" /> Add Customer
          </button>
        </div>

        <CsvImportModal open={importOpen} onClose={() => setImportOpen(false)} />
        <AddCustomerModal open={addOpen} onClose={() => setAddOpen(false)} />

        <Panel title="RFM Distribution" bodyClassName="p-6">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 16, right: 16, bottom: 24, left: 8 }}>
                <CartesianGrid stroke="rgba(0,0,0,0.05)" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Frequency"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#a1a1aa", fontFamily: "JetBrains Mono" }}
                  label={{ value: "FREQUENCY →", position: "bottom", offset: 0, fontSize: 10, fill: "#71717a" }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Monetary"
                  domain={[0, 5]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#a1a1aa", fontFamily: "JetBrains Mono" }}
                  label={{ value: "MONETARY", angle: -90, position: "insideLeft", fontSize: 10, fill: "#71717a" }}
                />
                <ZAxis type="number" dataKey="z" range={[40, 400]} />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  contentStyle={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 8, fontSize: 12 }}
                />
                <Scatter data={scatter} fill="var(--brand)" fillOpacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel
          title={segment ? `${segment} · ${filtered.length} customers` : "All Customers"}
          action={
            segment || q ? (
              <button
                onClick={() => {
                  const next = new URLSearchParams();
                  router.push(`?${next.toString()}`, { scroll: false });
                }}
                className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
              >
                Clear filters
              </button>
            ) : null
          }
        >
          <table className="w-full text-left">
            <thead className="bg-zinc-50 border-b border-zinc-950/5">
              <tr>
                {["Customer", "Segment", "Region", "Status", "MRR", "LTV", "Last"].map(
                  (h, i) => (
                    <th
                      key={h}
                      className={
                        "px-6 py-3 text-[10px] font-medium text-zinc-400 uppercase tracking-wider " +
                        (i >= 4 ? "text-right" : "")
                      }
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-950/5">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-50">
                  <td className="px-6 py-3.5">
                    <Link href={`/customers/${c.id}`} className="text-sm font-medium hover:text-brand">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-zinc-600">{c.segment}</td>
                  <td className="px-6 py-3.5 text-sm text-zinc-500">{c.region}</td>
                  <td className="px-6 py-3.5">
                    <span className={cn("px-2 py-0.5 text-[10px] font-medium rounded-full ring-1", statusStyle[c.status])}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-sm font-mono text-right tabular-nums text-zinc-600">
                    {compactCurrency(c.mrr)}
                  </td>
                  <td className="px-6 py-3.5 text-sm font-mono text-right tabular-nums text-zinc-900">
                    {compactCurrency(c.ltv)}
                  </td>
                  <td className="px-6 py-3.5 text-sm text-zinc-500 text-right">{c.recency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </>
  );
}

function PersonaCard({
  name, count, revenue, active, onClick,
}: {
  name: string; count: number; revenue: number; active?: boolean; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "text-left p-4 rounded-xl ring-1 transition-all " +
        (active ? "bg-brand/5 ring-brand/40" : "bg-surface ring-black/5 hover:ring-black/10")
      }
    >
      <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider truncate">{name}</p>
      <p className="text-lg font-mono font-medium tabular-nums mt-1">{number(count)}</p>
      <p className="text-xs text-zinc-500 font-mono tabular-nums mt-0.5">{compactCurrency(revenue)}</p>
    </button>
  );
}
