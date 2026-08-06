"use client";

import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import { compactCurrency } from "@/lib/formatters";
import type { RevenuePoint } from "@/lib/api";

interface Props {
  data: RevenuePoint[];
  /** Optional: number of months to slice from the end */
  months?: number;
}

export function RevenueTrendChart({ data, months }: Props) {
  const chartData = months ? data.slice(-months) : data;

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(0,0,0,0.05)" vertical={false} />
          <XAxis dataKey="month" axisLine={false} tickLine={false}
            tick={{ fontSize: 11, fill: "#71717a", fontFamily: "var(--font-jetbrains-mono, monospace)" }} />
          <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => compactCurrency(v)}
            tick={{ fontSize: 11, fill: "#a1a1aa", fontFamily: "var(--font-jetbrains-mono, monospace)" }}
            width={60} />
          <Tooltip cursor={{ stroke: "rgba(0,0,0,0.1)" }}
            contentStyle={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 8, fontSize: 12 }}
            formatter={(v: number) => compactCurrency(v)} />
          <Area type="monotone" dataKey="prior" stroke="rgba(0,0,0,0.15)"
            strokeDasharray="3 3" fill="transparent" strokeWidth={1.25} />
          <Area type="monotone" dataKey="revenue" stroke="var(--brand)"
            strokeWidth={2} fill="url(#rev)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
