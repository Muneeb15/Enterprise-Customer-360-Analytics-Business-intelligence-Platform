import type { Metadata } from "next";
import { Suspense } from "react";
import { SalesClient } from "./SalesClient";

export const metadata: Metadata = {
  title: "Sales Analytics",
  description: "Revenue by category, region, and seasonal trends.",
};

export default function SalesPage() {
  return (
    <Suspense>
      <SalesClient />
    </Suspense>
  );
}
