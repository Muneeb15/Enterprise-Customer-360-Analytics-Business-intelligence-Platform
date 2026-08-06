"use client";

import { useState, useMemo } from "react";
import type { Metadata } from "next";
import { Activity, Upload, Users, FileText, Settings, GitBranch, Search } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel } from "@/components/dashboard/Panel";

const LOGS = [
  { id: 1, type: "import",   user: "Sarah Jenkins", action: "Imported 142 customers from customers_q4.csv", time: "2 hours ago",   ip: "192.168.1.1" },
  { id: 2, type: "customer", user: "Alex Chen",     action: "Updated customer segment for Vertex Systems",  time: "4 hours ago",   ip: "192.168.1.2" },
  { id: 3, type: "report",   user: "Sarah Jenkins", action: "Generated Q4 2024 Executive Review PDF",       time: "6 hours ago",   ip: "192.168.1.1" },
  { id: 4, type: "settings", user: "Sarah Jenkins", action: "Updated organization billing plan to Enterprise", time: "1 day ago",  ip: "192.168.1.1" },
  { id: 5, type: "team",     user: "Sarah Jenkins", action: "Invited dana@acme.com as Viewer",              time: "2 days ago",    ip: "192.168.1.1" },
  { id: 6, type: "import",   user: "Alex Chen",     action: "Import failed — enterprise_contacts.csv (12 errors)", time: "2 days ago", ip: "192.168.1.2" },
  { id: 7, type: "github",   user: "Marie Osei",    action: "Analysed GitHub profile @sarahchen (score: 96)", time: "3 days ago", ip: "192.168.1.3" },
  { id: 8, type: "customer", user: "Ryo Watanabe",  action: "Exported customers list as CSV",               time: "4 days ago",   ip: "192.168.1.4" },
];

const typeIcon: Record<string, React.ReactNode> = {
  import:   <Upload className="size-3.5 text-brand" />,
  customer: <Users className="size-3.5 text-emerald-600" />,
  report:   <FileText className="size-3.5 text-violet-600" />,
  settings: <Settings className="size-3.5 text-zinc-500" />,
  team:     <Users className="size-3.5 text-amber-600" />,
  github:   <GitBranch className="size-3.5 text-zinc-700" />,
};

const typeBg: Record<string, string> = {
  import:"bg-brand/10", customer:"bg-emerald-50", report:"bg-violet-50",
  settings:"bg-zinc-100", team:"bg-amber-50", github:"bg-zinc-100",
};

export default function ActivityPage() {
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const filtered = useMemo(() => {
    const search = q.trim().toLowerCase();
    return LOGS.filter((log) => {
      if (typeFilter && log.type !== typeFilter) return false;
      if (search && !log.action.toLowerCase().includes(search) && !log.user.toLowerCase().includes(search)) return false;
      return true;
    });
  }, [q, typeFilter]);

  return (
    <>
      <PageHeader
        title="Activity Logs"
        subtitle={`${filtered.length} of ${LOGS.length} events`}
      />
      <div className="px-8 py-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="size-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search activity…"
              className="w-full text-sm bg-surface ring-1 ring-black/5 rounded-md pl-8 pr-3 py-1.5 focus:ring-brand/40 focus:outline-none"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs bg-surface ring-1 ring-black/5 rounded-md px-3 py-1.5 focus:outline-none text-zinc-600"
          >
            <option value="">All types</option>
            <option value="import">Import</option>
            <option value="customer">Customer</option>
            <option value="report">Report</option>
            <option value="settings">Settings</option>
            <option value="team">Team</option>
            <option value="github">GitHub</option>
          </select>
        </div>

        <Panel>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <Activity className="size-8 text-zinc-300" />
              <p className="text-sm text-zinc-500">No matching activity</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-950/5">
              {filtered.map((log) => (
                <div key={log.id} className="px-6 py-4 flex items-start gap-4 hover:bg-zinc-50 transition-colors">
                  <div className={`size-7 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${typeBg[log.type] ?? "bg-zinc-100"}`}>
                    {typeIcon[log.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-800">{log.action}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-zinc-500 font-medium">{log.user}</span>
                      <span className="text-zinc-200">·</span>
                      <span className="text-xs font-mono text-zinc-400">{log.ip}</span>
                    </div>
                  </div>
                  <span className="text-xs text-zinc-400 shrink-0 mt-0.5">{log.time}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
