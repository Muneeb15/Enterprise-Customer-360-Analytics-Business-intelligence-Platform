"use client";

import { useState } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { useGenerateReport, useJobStatus } from "@/features/reports/api";
import { Panel } from "@/components/dashboard/Panel";
import { ArrowLeft, Download, Loader2, RefreshCw, XCircle } from "lucide-react";

export function ReportDetailClient({ reportId }: { reportId: string }) {
  const [jobId, setJobId] = useState<string | null>(null);

  const {
    data: report,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["report", reportId],
    queryFn: () => api.getReport(reportId),
  });

  const { data: job } = useJobStatus(jobId);
  const generateMutation = useGenerateReport(reportId);

  if (isLoading) {
    return (
      <div className="px-8 pt-16 flex items-center justify-center">
        <Loader2 className="size-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error instanceof ApiError && error.status === 404) {
    notFound();
  }

  if (!report) return null;

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  const startGeneration = () => {
    generateMutation.mutate(undefined, {
      onSuccess: (data) => setJobId(data.job_id),
    });
  };

  const downloadPdf = () => {
    const a = document.createElement("a");
    a.href = `${apiBase}/api/jobs/${jobId}/download`;
    a.download = `${report.id}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const isRunning = job && (job.status === "queued" || job.status === "running");
  const isReady = job?.status === "ready";
  const isError = job?.status === "error";

  const headerAction = isReady ? (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setJobId(null)}
        className="text-xs font-medium text-zinc-500 hover:text-zinc-900 inline-flex items-center gap-1"
      >
        <RefreshCw className="size-3" /> Regenerate
      </button>
      <button
        onClick={downloadPdf}
        className="text-sm font-medium ring-1 ring-brand bg-brand text-brand-foreground py-1.5 px-3 rounded-md hover:opacity-90 inline-flex items-center gap-1.5"
      >
        <Download className="size-3.5" /> Download PDF
      </button>
    </div>
  ) : isRunning ? (
    <div className="flex items-center gap-3 ring-1 ring-black/5 bg-surface py-1.5 px-3 rounded-md">
      <Loader2 className="size-3.5 animate-spin text-brand" />
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
          {job!.status === "queued" ? "Queued" : "Generating"}
        </span>
        <div className="w-32 h-1 bg-zinc-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand transition-all"
            style={{ width: `${job!.progress}%` }}
          />
        </div>
      </div>
      <span className="text-xs font-mono tabular-nums text-zinc-500">
        {Math.round(job!.progress)}%
      </span>
      <button
        onClick={() => setJobId(null)}
        className="text-zinc-400 hover:text-rose-600"
        title="Cancel"
      >
        <XCircle className="size-4" />
      </button>
    </div>
  ) : (
    <button
      onClick={startGeneration}
      disabled={generateMutation.isPending}
      className="text-sm font-medium ring-1 ring-brand bg-brand text-brand-foreground py-1.5 px-3 rounded-md hover:opacity-90 inline-flex items-center gap-1.5 disabled:opacity-50"
    >
      <Download className="size-3.5" /> Generate PDF
    </button>
  );

  return (
    <>
      <div className="px-8 pt-8 pb-2 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">{report.name}</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {report.type} · {report.size}
          </p>
        </div>
        {headerAction}
      </div>

      <div className="px-8 pb-10 space-y-6">
        <Link
          href="/reports"
          className="text-xs text-zinc-500 hover:text-zinc-900 inline-flex items-center gap-1 -mt-2"
        >
          <ArrowLeft className="size-3" /> All reports
        </Link>

        {job && (
          <div
            className={
              "text-xs px-4 py-2.5 rounded-md ring-1 flex items-center gap-2 " +
              (isReady
                ? "bg-emerald-50 ring-emerald-600/10 text-emerald-800"
                : isError
                  ? "bg-rose-50 ring-rose-600/10 text-rose-800"
                  : "bg-brand/5 ring-brand/20 text-zinc-700")
            }
          >
            {isReady ? (
              <>
                <span className="font-medium">PDF ready.</span>{" "}
                <button
                  onClick={downloadPdf}
                  className="text-brand hover:underline font-medium"
                >
                  Download now
                </button>
              </>
            ) : isError ? (
              <span>Generation failed: {job.error}</span>
            ) : (
              <>
                <Loader2 className="size-3 animate-spin" />
                <span>
                  {job.status === "queued" ? "Queued for generation…" : "Generating PDF…"} (
                  {Math.round(job.progress)}%)
                </span>
              </>
            )}
          </div>
        )}

        <Panel bodyClassName="aspect-[8.5/11] max-w-3xl mx-auto w-full p-12 space-y-6">
          <div>
            <p className="text-[10px] font-semibold text-brand uppercase tracking-widest">
              Nexus Analytics · {report.type}
            </p>
            <h2 className="text-2xl font-semibold mt-2 tracking-tight">{report.name}</h2>
            <p className="text-sm text-zinc-500 mt-1">
              Prepared by {report.author} · Updated {report.updated}
            </p>
          </div>
          <div className="border-t border-zinc-950/5 pt-6 space-y-4 text-sm text-zinc-700 leading-relaxed">
            <p>
              Executive summary: the {report.type.toLowerCase()} performance over the reporting
              window shows consistent expansion in the Enterprise Growth cohort, offset by an
              uptick in early-stage churn among SMB accounts joining in Q2.
            </p>
            <div className="grid grid-cols-3 gap-4 my-8">
              {["Revenue", "Cohort Health", "Forecast"].map((s) => (
                <div key={s} className="p-4 bg-zinc-50 rounded-md">
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                    {s}
                  </p>
                  <div className="h-16 mt-3 flex items-end gap-1">
                    {[0.4, 0.6, 0.5, 0.8, 0.7, 1].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-brand/60 rounded-sm"
                        style={{ height: `${h * 100}%` }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p>
              Recommendations include a targeted retention program for the SMB cohort and
              capacity investment in the APAC region to support 22% projected upgrade demand.
            </p>
          </div>
        </Panel>
      </div>
    </>
  );
}
