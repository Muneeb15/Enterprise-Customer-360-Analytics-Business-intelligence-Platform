import type { Metadata } from "next";
import { Suspense } from "react";
import { BranchesClient } from "./BranchesClient";
export const metadata: Metadata = { title: "Branch Performance" };
export default function BranchesPage() { return <Suspense><BranchesClient /></Suspense>; }
