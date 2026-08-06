/**
 * Centralized API client for Nexus Analytics.
 *
 * All requests go through this module. No fetch() calls anywhere else.
 * Base URL is read from NEXT_PUBLIC_API_URL (default: http://localhost:8000).
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

// ── Error type ────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ── Response types (mirror backend schemas exactly) ───────────────────────────

export type Kpi = {
  label: string;
  value: string;
  delta: string;
  tone: "pos" | "neg" | "neutral";
  hero?: boolean;
};

export type RevenuePoint = { month: string; revenue: number; prior: number };

export type Segment = {
  name: string;
  share: number;
  revenue: number;
  count: number;
};

export type Region = { name: string; share: number; revenue: number };

export type CategoryRevenue = { name: string; value: number };

export type HeatmapCell = { month: string; intensity: number };

export type HeatmapRow = { week: string; values: HeatmapCell[] };

export type FunnelStage = { stage: string; value: number };

export type Campaign = {
  id: string;
  name: string;
  channel: string;
  spend: number;
  revenue: number;
  roas: number;
  cac: number;
};

export type Customer = {
  id: string;
  name: string;
  status: "Active" | "At Risk" | "Churned";
  segment: string;
  region: string;
  ltv: number;
  mrr: number;
  recency: string;
  frequency: number;
  monetary: number;
  joined: string;
};

export type CustomerTransaction = {
  id: string;
  date: string;
  description: string;
  category: "Billing" | "Support" | "Contract" | "Product" | "Expansion";
  amount: number;
};

export type Report = {
  id: string;
  name: string;
  type: string;
  updated: string;
  size: string;
  author: string;
};

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  lastActive: string;
};

export type Job = {
  job_id: string;
  report_id: string;
  status: "queued" | "running" | "ready" | "error";
  progress: number;
  pdf_url: string | null;
  error: string | null;
};

export type GenerateResponse = { job_id: string; status: string };

// ── Pagination wrapper ────────────────────────────────────────────────────────

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type CsvPreviewRow = { row: number; data: Record<string, string> };

export type CsvPreviewResponse = {
  headers: string[];
  preview_rows: CsvPreviewRow[];
  total_rows: number;
  file_id: string;
};

export type ColumnMapping = {
  csv_column: string;
  target_field: string; // field key or "__skip__"
};

export type ImportField = {
  key: string;
  label: string;
  required: boolean;
};

export type ImportRowError = {
  row: number;
  column: string | null;
  message: string;
};

export type ImportResult = {
  imported: number;
  skipped: number;
  errors: ImportRowError[];
  rollback: boolean;
};

// ── Products ──────────────────────────────────────────────────────────────────

export type Product = {
  id: string; name: string; sku: string; category: string;
  price: number; units_sold: number; revenue: number;
  growth_pct: number; return_rate: number; status: string;
};

export type CategoryBreakdown = {
  category: string; revenue: number; units_sold: number;
  share_pct: number; growth_pct: number;
};

export type ProductSummary = {
  total_products: number; total_revenue: number;
  top_category: string; avg_growth_pct: number;
};

// ── Stores / Branches ─────────────────────────────────────────────────────────

export type Store = {
  id: string; name: string; code: string; country: string;
  region: string; city: string; manager: string;
  staff_count: number; annual_target: number; annual_revenue: number;
  customer_count: number; nps_score: number; status: string; attainment_pct: number;
};

export type BranchSummary = {
  total_stores: number; total_revenue: number;
  avg_attainment: number; top_store: string; countries: number;
};

// ── Data Sources ──────────────────────────────────────────────────────────────

export type DataSource = {
  id: string; name: string; source_type: string; status: string;
  last_sync: string | null; records_synced: string; description: string;
};

export type DataSourceSummary = {
  total: number; connected: number; last_sync: string | null;
};

// ── Analytics / Data Science ──────────────────────────────────────────────────

// ── Frontend types matching the updated nullable schema ──────────────────────

export type ForecastPoint = {
  month: string;
  actual: number | null;
  forecast: number | null;   // null for historical months
  lower: number | null;
  upper: number | null;
};

export type AnomalyPoint = {
  month_index: number; value: number; expected: number;
  z_score: number; severity: "warning" | "critical"; direction: "high" | "low";
};

export type CorrelationPair = {
  metric_a: string; metric_b: string; coefficient: number; strength: string;
};

export type StatsSummary = {
  metric: string; count: number; mean: number; median: number;
  std: number; min: number; max: number; q1: number; q3: number;
};

export type TrendAnalysis = {
  metric: string; slope: number; direction: string;
  r_squared: number; growth_rates: number[];
};

export type EDAReport = {
  stats: StatsSummary[];
  correlations: CorrelationPair[];
  anomalies: AnomalyPoint[];
  trend: TrendAnalysis;
};

// ── Core fetch ────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new ApiError(res.status, text);
  }
  return res.json() as Promise<T>;
}

function buildQS(params?: Record<string, string | undefined>): string {
  if (!params) return "";
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) p.set(k, v);
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

// ── Named fetchers ────────────────────────────────────────────────────────────

export const api = {
  // KPIs & Revenue
  getKpis: () =>
    apiFetch<Kpi[]>("/api/kpis", { cache: "no-store" }),

  getRevenueSeries: () =>
    apiFetch<RevenuePoint[]>("/api/revenue-series", { cache: "no-store" }),

  getSegments: () =>
    apiFetch<Segment[]>("/api/segments", { cache: "no-store" }),

  getRegions: () =>
    apiFetch<Region[]>("/api/regions", { cache: "no-store" }),

  getCategoryRevenue: () =>
    apiFetch<CategoryRevenue[]>("/api/category-revenue", { cache: "no-store" }),

  getSeasonalHeatmap: () =>
    apiFetch<HeatmapRow[]>("/api/seasonal-heatmap", {
      next: { revalidate: 3600 },
    } as RequestInit),

  getFunnel: () =>
    apiFetch<FunnelStage[]>("/api/funnel", { cache: "no-store" }),

  getCampaigns: (channel?: string) =>
    apiFetch<Campaign[]>(
      `/api/campaigns${channel && channel !== "All" ? `?channel=${encodeURIComponent(channel)}` : ""}`,
      { cache: "no-store" },
    ),

  // Customers
  // CSV Import types ─────────────────────────────────────────────────────────
  getCustomers: (params?: { segment?: string; status?: string; page?: number; page_size?: number }) =>
    apiFetch<PaginatedResponse<Customer>>(`/api/customers${buildQS({ ...params, page: params?.page?.toString(), page_size: params?.page_size?.toString() })}`, { cache: "no-store" }),

  // Convenience: fetch all customers (page_size=500, returns flat list)
  getAllCustomers: (params?: { segment?: string; status?: string }) =>
    apiFetch<PaginatedResponse<Customer>>(`/api/customers${buildQS({ ...params, page_size: "500" })}`, { cache: "no-store" })
      .then((r) => r.items),

  createCustomer: (data: {
    name: string; email?: string; mrr?: number; ltv?: number;
    segment?: string; region?: string;
    status?: "Active" | "At Risk" | "Churned"; joined?: string;
  }) =>
    apiFetch<Customer>("/api/customers", { method: "POST", body: JSON.stringify(data) }),

  getCustomer: (id: string) =>
    apiFetch<Customer>(`/api/customers/${encodeURIComponent(id)}`, {
      cache: "no-store",
    }),

  getTransactions: (id: string) =>
    apiFetch<CustomerTransaction[]>(
      `/api/customers/${encodeURIComponent(id)}/transactions`,
      { cache: "no-store" },
    ),

  // Reports
  getReports: (params?: { type?: string }) =>
    apiFetch<PaginatedResponse<Report>>(`/api/reports${buildQS(params)}`, {
      cache: "no-store",
    }),

  getReport: (id: string) =>
    apiFetch<Report>(`/api/reports/${encodeURIComponent(id)}`, {
      cache: "no-store",
    }),

  // Team
  getTeamMembers: () =>
    apiFetch<TeamMember[]>("/api/team-members", {
      next: { revalidate: 60 },
    } as RequestInit),

  // Jobs
  generateReport: (reportId: string) =>
    apiFetch<GenerateResponse>(
      `/api/reports/${encodeURIComponent(reportId)}/generate`,
      { method: "POST" },
    ),

  getJob: (jobId: string) =>
    apiFetch<Job>(`/api/jobs/${encodeURIComponent(jobId)}`, {
      cache: "no-store",
    }),

  // CSV Import
  getImportFields: () =>
    apiFetch<ImportField[]>("/api/import/fields", { cache: "no-store" }),

  previewCsv: (file: File): Promise<CsvPreviewResponse> => {
    const form = new FormData();
    form.append("file", file);
    return fetch(`${BASE_URL}/api/import/preview`, { method: "POST", body: form })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text().catch(() => res.statusText);
          throw new ApiError(res.status, text);
        }
        return res.json() as Promise<CsvPreviewResponse>;
      });
  },

  importCustomers: (fileId: string, mappings: ColumnMapping[], filename = "imported.csv") =>
    apiFetch<ImportResult>("/api/import/customers", {
      method: "POST",
      body: JSON.stringify({ file_id: fileId, mappings, filename }),
    }),

  getImportHistory: () =>
    apiFetch<Array<{
      id: string; filename: string; rows_imported: number;
      rows_skipped: number; rows_error: number; status: string;
      imported_by: string; created_at: string | null;
    }>>("/api/import/history", { cache: "no-store" }),

  // Products
  getProducts: () => apiFetch<Product[]>("/api/products", { cache: "no-store" }),
  getProductCategories: () => apiFetch<CategoryBreakdown[]>("/api/products/categories", { cache: "no-store" }),
  getProductSummary: () => apiFetch<ProductSummary>("/api/products/summary", { cache: "no-store" }),

  // Stores / Branches
  getStores: (params?: { country?: string; region?: string }) =>
    apiFetch<Store[]>(`/api/stores${buildQS(params)}`, { cache: "no-store" }),
  getBranchSummary: () => apiFetch<BranchSummary>("/api/stores/summary", { cache: "no-store" }),

  // Data Sources
  getDataSources: () => apiFetch<DataSource[]>("/api/data-sources", { cache: "no-store" }),
  getDataSourceSummary: () => apiFetch<DataSourceSummary>("/api/data-sources/summary", { cache: "no-store" }),

  // Analytics / Data Science
  getForecast: (periods = 3) =>
    apiFetch<ForecastPoint[]>(`/api/analytics/forecast?periods=${periods}`, { cache: "no-store" }),
  getAnomalies: () => apiFetch<AnomalyPoint[]>("/api/analytics/anomalies", { cache: "no-store" }),
  getCorrelations: () => apiFetch<CorrelationPair[]>("/api/analytics/correlations", { cache: "no-store" }),
  getEDA: () => apiFetch<EDAReport>("/api/analytics/eda", { cache: "no-store" }),

  // Customer analytics
  getCustomerAnalytics: () =>
    apiFetch<{
      total_customers: number; active_customers: number;
      churned_customers: number; at_risk_customers: number;
      churn_rate_pct: number; retention_rate_pct: number;
      repeat_purchase_rate_pct: number; avg_ltv: number;
      aov: number; total_mrr: number;
      monthly_growth: number[]; growth_labels: string[];
    }>("/api/customer-analytics", { cache: "no-store" }),
};
