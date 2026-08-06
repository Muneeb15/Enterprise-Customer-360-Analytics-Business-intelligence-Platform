import type { Metadata } from "next";
import { Suspense } from "react";
import { AnalyticsClient } from "./AnalyticsClient";

export const metadata: Metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  return (
    <Suspense>
      <AnalyticsClient />
    </Suspense>
  );
}
