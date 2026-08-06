import type { Metadata } from "next";
import { Suspense } from "react";
import { ReportsClient } from "./ReportsClient";

export const metadata: Metadata = {
  title: "Report Center",
};

export default function ReportsPage() {
  return (
    <Suspense>
      <ReportsClient />
    </Suspense>
  );
}
