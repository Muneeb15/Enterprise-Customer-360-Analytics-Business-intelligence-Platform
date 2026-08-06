import type { Metadata } from "next";
import { Suspense } from "react";
import { ImportsClient } from "./ImportsClient";

export const metadata: Metadata = { title: "CSV Imports" };

export default function ImportsPage() {
  return (
    <Suspense>
      <ImportsClient />
    </Suspense>
  );
}
