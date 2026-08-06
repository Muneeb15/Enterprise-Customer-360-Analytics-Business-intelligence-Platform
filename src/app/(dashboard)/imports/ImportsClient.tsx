"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel } from "@/components/dashboard/Panel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { CsvImportModal } from "@/components/csv-import/CsvImportModal";
import { api } from "@/lib/api";

const statusIcon: Record<string, React.ReactNode> = {
  success: <CheckCircle className="size-4 text-emerald-600" />,
  error:   <AlertCircle className="size-4 text-rose-600" />,
  partial: <AlertCircle className="size-4 text-amber-500" />,
  pending: <Clock className="size-4 text-amber-500" />,
};

const statusStyle: Record<string, string> = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  error:   "bg-rose-50 text-rose-700 ring-rose-200",
  partial: "bg-amber-50 text-amber-700 ring-amber-200",
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
};

function timeAgo(isoString: string | null): string {
  if (!isoString) return "—";
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function ImportsClient() {
  const [modalOpen, setModalOpen] = useState(false);
  const qc = useQueryClient();

  const { data: history = [], isLoading } = useQuery({
    queryKey: ["import-history"],
    queryFn: api.getImportHistory,
    refetchInterval: 10_000, // poll every 10s to pick up new imports
  });

  const totalRows = history.reduce((a, h) => a + h.rows_imported, 0);
  const successCount = history.filter((h) => h.status === "success").length;
  const successRate = history.length > 0
    ? Math.round((successCount / history.length) * 100)
    : 0;

  const handleClose = () => {
    setModalOpen(false);
    // Refresh history after import
    qc.invalidateQueries({ queryKey: ["import-history"] });
  };

  return (
    <>
      <PageHeader
        title="CSV Imports"
        subtitle="Import customer data from CSV files"
        action={
          <button
            onClick={() => setModalOpen(true)}
            className="text-xs font-medium ring-1 ring-brand bg-brand text-brand-foreground py-1.5 px-3 rounded-md hover:opacity-90 inline-flex items-center gap-1.5"
          >
            <Upload className="size-3.5" /> New Import
          </button>
        }
      />

      <div className="px-8 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-surface ring-1 ring-black/5 rounded-xl p-5">
            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Total Imports</p>
            <p className="text-2xl font-mono font-semibold tabular-nums mt-1.5 text-zinc-900">
              {history.length}
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">All time</p>
          </div>
          <div className="bg-surface ring-1 ring-black/5 rounded-xl p-5">
            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Rows Imported</p>
            <p className="text-2xl font-mono font-semibold tabular-nums mt-1.5 text-zinc-900">
              {totalRows.toLocaleString()}
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">Customers created</p>
          </div>
          <div className="bg-surface ring-1 ring-black/5 rounded-xl p-5">
            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Success Rate</p>
            <p className="text-2xl font-mono font-semibold tabular-nums mt-1.5 text-zinc-900">
              {successRate}%
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">Successful imports</p>
          </div>
        </div>

        {/* History */}
        <Panel title="Import History">
          {isLoading ? (
            <div className="px-6 py-8 text-center text-sm text-zinc-400">Loading history…</div>
          ) : history.length === 0 ? (
            <EmptyState
              icon={Upload}
              title="No imports yet"
              description="Upload a CSV file to get started importing customers"
              action={
                <button
                  onClick={() => setModalOpen(true)}
                  className="text-xs font-medium ring-1 ring-brand bg-brand text-brand-foreground py-1.5 px-3 rounded-md hover:opacity-90"
                >
                  Upload CSV
                </button>
              }
            />
          ) : (
            <table className="w-full text-left">
              <thead className="bg-zinc-50 border-b border-zinc-950/5">
                <tr>
                  {["File", "Status", "Imported", "Skipped", "Errors", "By", "When"].map((h, i) => (
                    <th key={h} className={`px-6 py-3 text-[10px] font-medium text-zinc-400 uppercase tracking-wider${i >= 2 && i <= 4 ? " text-center" : ""}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-950/5">
                {history.map((imp) => (
                  <tr key={imp.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2.5">
                        {statusIcon[imp.status] ?? statusIcon.pending}
                        <span className="text-sm font-medium text-zinc-800 font-mono truncate max-w-[180px]">
                          {imp.filename}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1 ${statusStyle[imp.status] ?? statusStyle.pending}`}>
                        {imp.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-sm font-mono tabular-nums text-center text-emerald-700 font-semibold">
                      {imp.rows_imported.toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 text-sm font-mono tabular-nums text-center text-amber-600">
                      {imp.rows_skipped}
                    </td>
                    <td className="px-6 py-3.5 text-sm font-mono tabular-nums text-center text-rose-600">
                      {imp.rows_error}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-zinc-500 truncate max-w-[120px]">
                      {imp.imported_by || "—"}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-zinc-400 text-right whitespace-nowrap">
                      {timeAgo(imp.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>

      <CsvImportModal open={modalOpen} onClose={handleClose} />
    </>
  );
}
