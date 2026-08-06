"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel } from "@/components/dashboard/Panel";
import { cn } from "@/lib/utils";
import {
  CheckCircle, AlertCircle, XCircle, RefreshCw,
  Users, Globe, Smartphone, ShoppingCart, MessageSquare,
  Mail, CreditCard, Share2, Database,
} from "lucide-react";

const typeIcon: Record<string, React.ReactNode> = {
  crm:     <Users className="size-4 text-blue-600" />,
  erp:     <Database className="size-4 text-violet-600" />,
  pos:     <ShoppingCart className="size-4 text-emerald-600" />,
  web:     <Globe className="size-4 text-sky-600" />,
  mobile:  <Smartphone className="size-4 text-indigo-600" />,
  support: <MessageSquare className="size-4 text-amber-600" />,
  email:   <Mail className="size-4 text-pink-600" />,
  payment: <CreditCard className="size-4 text-green-600" />,
  social:  <Share2 className="size-4 text-orange-600" />,
};

const typeBg: Record<string, string> = {
  crm:"bg-blue-50", erp:"bg-violet-50", pos:"bg-emerald-50",
  web:"bg-sky-50", mobile:"bg-indigo-50", support:"bg-amber-50",
  email:"bg-pink-50", payment:"bg-green-50", social:"bg-orange-50",
};

const statusConfig = {
  connected:    { icon: <CheckCircle className="size-4 text-emerald-600" />, style: "text-emerald-700 bg-emerald-50 ring-emerald-200" },
  disconnected: { icon: <XCircle className="size-4 text-zinc-400" />,       style: "text-zinc-600 bg-zinc-100 ring-zinc-200" },
  error:        { icon: <AlertCircle className="size-4 text-rose-600" />,    style: "text-rose-700 bg-rose-50 ring-rose-200" },
  syncing:      { icon: <RefreshCw className="size-4 text-brand animate-spin" />, style: "text-brand bg-brand/10 ring-brand/20" },
};

export function DataSourcesClient() {
  const { data: sources = [] } = useQuery({ queryKey: ["data-sources"], queryFn: api.getDataSources });
  const { data: summary } = useQuery({ queryKey: ["data-source-summary"], queryFn: api.getDataSourceSummary });

  return (
    <>
      <PageHeader title="Data Sources" subtitle="Connected business systems and integration status" />
      <div className="px-8 py-6 space-y-6">
        {/* Summary bar */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Sources", value: summary ? String(summary.total) : "—" },
            { label: "Connected", value: summary ? String(summary.connected) : "—" },
            { label: "Last Sync", value: summary?.last_sync ?? "Never" },
          ].map((s) => (
            <div key={s.label} className="bg-surface ring-1 ring-black/5 rounded-xl p-5">
              <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{s.label}</p>
              <p className="text-2xl font-mono font-semibold mt-1.5 text-zinc-900">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Source cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sources.map((src) => {
            const sc = statusConfig[src.status as keyof typeof statusConfig] ?? statusConfig.disconnected;
            return (
              <div key={src.id} className="bg-surface ring-1 ring-black/5 rounded-xl p-5 hover:ring-zinc-200 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className={cn("size-10 rounded-lg flex items-center justify-center", typeBg[src.source_type] ?? "bg-zinc-100")}>
                    {typeIcon[src.source_type] ?? <Database className="size-4 text-zinc-500" />}
                  </div>
                  <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1 inline-flex items-center gap-1", sc.style)}>
                    {sc.icon}
                    {src.status}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-zinc-900">{src.name}</h3>
                <p className="text-xs text-zinc-500 mt-0.5">{src.description}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-mono">{src.records_synced} records</span>
                  <span>{src.last_sync ? `Synced ${src.last_sync}` : "Not connected"}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
