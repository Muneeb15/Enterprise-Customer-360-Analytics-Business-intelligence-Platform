import type { Metadata } from "next";
import { Suspense } from "react";
import { CustomerAnalyticsClient } from "./CustomerAnalyticsClient";
export const metadata: Metadata = { title: "Customer Analytics" };
export default function CustomerAnalyticsPage() { return <Suspense><CustomerAnalyticsClient /></Suspense>; }
