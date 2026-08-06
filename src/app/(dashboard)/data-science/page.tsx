import type { Metadata } from "next";
import { Suspense } from "react";
import { DataScienceClient } from "./DataScienceClient";
export const metadata: Metadata = { title: "Future Predictions" };
export default function DataSciencePage() { return <Suspense><DataScienceClient /></Suspense>; }
