import type { Metadata } from "next";
import { Suspense } from "react";
import { MarketingClient } from "./MarketingClient";

export const metadata: Metadata = {
  title: "Marketing Analytics",
  description: "Acquisition funnel, campaign ROAS and CAC trends.",
};

export default function MarketingPage() {
  return (
    <Suspense>
      <MarketingClient />
    </Suspense>
  );
}
