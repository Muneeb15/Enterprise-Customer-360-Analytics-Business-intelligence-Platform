import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/dashboard/PageSkeleton";
import { OverviewDynamic } from "./OverviewDynamic";

export const metadata: Metadata = {
  title: "Executive Overview",
  description: "Revenue, active customers, churn and top segments at a glance.",
};

// Not force-dynamic — let Next.js cache the shell; data loads client-side
export default function OverviewPage() {
  return (
    <Suspense fallback={<PageSkeleton kpis rows={5} />}>
      <OverviewDynamic />
    </Suspense>
  );
}
