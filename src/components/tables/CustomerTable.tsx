"use client";

import Link from "next/link";
import type { Customer } from "@/lib/api";
import { currency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const statusStyle: Record<string, string> = {
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  "At Risk": "bg-amber-50 text-amber-700 ring-amber-600/10",
  Churned: "bg-zinc-100 text-zinc-500 ring-zinc-600/10",
};

interface Props {
  customers: Customer[];
  limit?: number;
}

export function CustomerTable({ customers, limit }: Props) {
  const rows = limit ? customers.slice(0, limit) : customers;
  return (
    <table className="w-full text-left">
      <thead className="bg-zinc-50 border-b border-zinc-950/5">
        <tr>
          <Th>Customer</Th>
          <Th>Segment</Th>
          <Th>Region</Th>
          <Th>Status</Th>
          <Th className="text-right">MRR</Th>
          <Th className="text-right">Lifetime Value</Th>
          <Th className="text-right">Last Activity</Th>
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-950/5">
        {rows.map((c) => (
          <tr key={c.id} className="hover:bg-zinc-50 transition-colors">
            <td className="px-6 py-3.5">
              <Link href={`/customers/${c.id}`} className="flex items-center gap-3 group">
                <div className="size-6 bg-zinc-100 rounded-full flex items-center justify-center text-[10px] font-medium text-zinc-500">
                  {c.name
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <span className="text-sm font-medium group-hover:text-brand transition-colors">
                  {c.name}
                </span>
              </Link>
            </td>
            <td className="px-6 py-3.5 text-sm text-zinc-600">{c.segment}</td>
            <td className="px-6 py-3.5 text-sm text-zinc-500">{c.region}</td>
            <td className="px-6 py-3.5">
              <span
                className={cn(
                  "px-2 py-0.5 text-[10px] font-medium rounded-full ring-1",
                  statusStyle[c.status],
                )}
              >
                {c.status}
              </span>
            </td>
            <td className="px-6 py-3.5 text-sm font-mono text-right text-zinc-600 tabular-nums">
              {currency(c.mrr)}
            </td>
            <td className="px-6 py-3.5 text-sm font-mono text-right text-zinc-900 tabular-nums">
              {currency(c.ltv)}
            </td>
            <td className="px-6 py-3.5 text-sm text-zinc-500 text-right">{c.recency}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={
        "px-6 py-3 text-[10px] font-medium text-zinc-400 uppercase tracking-wider " + className
      }
    >
      {children}
    </th>
  );
}
