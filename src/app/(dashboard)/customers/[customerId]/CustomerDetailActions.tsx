"use client";

import { Download } from "lucide-react";
import { downloadCSV, type CsvColumn } from "@/lib/csv";
import type { Customer, CustomerTransaction } from "@/lib/api";

const attrCols: CsvColumn<{ label: string; value: string | number }>[] = [
  { header: "Attribute", value: (r) => r.label },
  { header: "Value", value: (r) => r.value },
];

const txCols: CsvColumn<CustomerTransaction>[] = [
  { header: "Date", value: (t) => t.date },
  { header: "Description", value: (t) => t.description },
  { header: "Category", value: (t) => t.category },
  { header: "Amount", value: (t) => t.amount },
];

/** Export-attributes button shown in the page header. */
export function CustomerDetailActions({
  customer,
  transactions,
}: {
  customer: Customer;
  transactions: CustomerTransaction[];
}) {
  const attrs = [
    { label: "Customer", value: customer.name },
    { label: "Segment", value: customer.segment },
    { label: "Region", value: customer.region },
    { label: "Status", value: customer.status },
    { label: "MRR", value: customer.mrr },
    { label: "LTV", value: customer.ltv },
    { label: "Recency", value: customer.recency },
    { label: "Frequency", value: customer.frequency },
    { label: "Monetary", value: customer.monetary },
    { label: "Joined", value: customer.joined },
  ];

  return (
    <button
      onClick={() => downloadCSV(`${customer.id}-attributes`, attrs, attrCols)}
      className="text-sm font-medium ring-1 ring-black/5 bg-surface py-1.5 px-3 rounded-md hover:bg-zinc-50 inline-flex items-center gap-1.5"
    >
      <Download className="size-3.5" /> Export attributes
    </button>
  );
}

/** Export-CSV button shown in the Transactions panel header. */
export function CustomerTxExportButton({
  customerId,
  transactions,
}: {
  customerId: string;
  transactions: CustomerTransaction[];
}) {
  return (
    <button
      onClick={() => downloadCSV(`${customerId}-transactions`, transactions, txCols)}
      className="text-xs font-medium ring-1 ring-black/5 bg-surface py-1 px-2.5 rounded hover:bg-zinc-50 inline-flex items-center gap-1.5"
    >
      <Download className="size-3" /> Export CSV
    </button>
  );
}
