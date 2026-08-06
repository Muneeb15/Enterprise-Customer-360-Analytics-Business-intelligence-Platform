import type { Metadata } from "next";
import { Suspense } from "react";
import { api } from "@/lib/api";
import { ReportDetailClient } from "./ReportDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ reportId: string }>;
}): Promise<Metadata> {
  const { reportId } = await params;
  const report = await api.getReport(reportId).catch(() => null);
  return { title: report?.name ?? "Report" };
}

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  return (
    <Suspense>
      <ReportDetailClient reportId={reportId} />
    </Suspense>
  );
}
