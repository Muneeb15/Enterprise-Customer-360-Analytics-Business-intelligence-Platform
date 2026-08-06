import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductsClient } from "./ProductsClient";
export const metadata: Metadata = { title: "Product Performance" };
export default function ProductsPage() { return <Suspense><ProductsClient /></Suspense>; }
