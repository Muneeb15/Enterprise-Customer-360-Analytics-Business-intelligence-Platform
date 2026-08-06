import type { Metadata } from "next";
import { Suspense } from "react";
import { CustomersClient } from "./CustomersClient";

export const metadata: Metadata = {
  title: "Customer Segmentation",
  description: "RFM segmentation explorer and customer directory.",
};

export default function CustomersPage() {
  return (
    <Suspense>
      <CustomersClient />
    </Suspense>
  );
}
