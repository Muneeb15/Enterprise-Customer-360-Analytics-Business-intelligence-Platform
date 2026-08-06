import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import type { CustomerTransaction } from "@/lib/api";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Panel } from "@/components/dashboard/Panel";
import { currency, number } from "@/lib/formatters";
import { ArrowLeft } from "lucide-react";
import {
  CustomerDetailActions,
  CustomerTxExportButton,
} from "./CustomerDetailActions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ customerId: string }>;
}): Promise<Metadata> {
  const { customerId } = await params;
  const customer = await api.getCustomer(customerId).catch(() => null);
  return { title: customer?.name ?? "Customer" };
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;

  let customer;
  let transactions: CustomerTransaction[];

  try {
    [customer, transactions] = await Promise.all([
      api.getCustomer(customerId),
      api.getTransactions(customerId),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const c = customer;

  return (
    <>
      <div className="px-8 pt-8 pb-2 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">{c.name}</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {c.segment} · {c.region}
          </p>
        </div>
        <CustomerDetailActions customer={c} transactions={transactions} />
      </div>

      <div className="px-8 pb-10 space-y-6">
        <Link
          href="/customers"
          className="text-xs text-zinc-500 hover:text-zinc-900 inline-flex items-center gap-1 -mt-2"
        >
          <ArrowLeft className="size-3" /> All customers
        </Link>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KpiCard label="Lifetime Value" value={currency(c.ltv)} hero />
          <KpiCard label="Monthly Recurring" value={currency(c.mrr)} />
          <KpiCard label="Status" value={c.status} />
          <KpiCard label="Joined" value={c.joined} />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Panel title="RFM Profile" bodyClassName="p-6">
            <div className="grid grid-cols-3 gap-4">
              <RfmScore label="Recency" value={c.recency} />
              <RfmScore label="Frequency" value={number(c.frequency)} />
              <RfmScore label="Monetary" value={`${c.monetary}/5`} />
            </div>
          </Panel>

          <Panel title="Recent Activity" className="lg:col-span-2" bodyClassName="p-0">
            <ul className="divide-y divide-zinc-950/5">
              {[
                { t: "2h ago", body: "Upgraded to Enterprise Plus tier", tag: "Billing" },
                { t: "1d ago", body: "Support ticket #4821 resolved", tag: "Support" },
                { t: "3d ago", body: "Renewed annual contract — $342,000", tag: "Contract" },
                { t: "2w ago", body: "Feature adoption: Advanced Analytics", tag: "Product" },
              ].map((row) => (
                <li key={row.t} className="px-6 py-3.5 flex items-center gap-4">
                  <span className="text-xs font-mono text-zinc-400 w-16 tabular-nums">
                    {row.t}
                  </span>
                  <span className="text-sm text-zinc-700 flex-1">{row.body}</span>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 px-2 py-0.5 bg-zinc-100 rounded">
                    {row.tag}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <Panel
          title="Transactions"
          action={
            <CustomerTxExportButton customerId={c.id} transactions={transactions} />
          }
        >
          <table className="w-full text-left">
            <thead className="bg-zinc-50 border-b border-zinc-950/5">
              <tr>
                {["Date", "Description", "Category", "Amount"].map((h, i) => (
                  <th
                    key={h}
                    className={
                      "px-6 py-3 text-[10px] font-medium text-zinc-400 uppercase tracking-wider " +
                      (i === 3 ? "text-right" : "")
                    }
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-950/5">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-zinc-50">
                  <td className="px-6 py-3.5 text-sm font-mono text-zinc-500 tabular-nums">
                    {t.date}
                  </td>
                  <td className="px-6 py-3.5 text-sm text-zinc-700">{t.description}</td>
                  <td className="px-6 py-3.5 text-xs">
                    <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 uppercase tracking-wider text-[10px] font-medium">
                      {t.category}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-sm font-mono text-right tabular-nums text-zinc-900">
                    {currency(t.amount)}
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

function RfmScore({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
        {label}
      </span>
      <span className="font-mono text-lg tabular-nums text-zinc-900">{value}</span>
    </div>
  );
}
