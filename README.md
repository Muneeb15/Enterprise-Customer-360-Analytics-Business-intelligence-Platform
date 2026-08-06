# Nexus Analytics

**Enterprise Customer 360 Analytics & Business Intelligence Platform**

A production-grade SaaS dashboard for revenue intelligence, customer segmentation, marketing attribution, forecasting, and automated reporting. Built for teams that need real data — not demos.

---

## Quick Start

**Double-click `start.bat`** from Windows Explorer to launch everything automatically.

Or manually in two terminals:

```sh
# Terminal 1 — Backend (auto-seeds database on first run)
uvicorn backend.main:app --reload --port 8000

# Terminal 2 — Frontend
npm run dev
```

Open **`http://localhost:3000`**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | Next.js 15 (App Router, Turbopack) |
| UI components | Radix UI + shadcn/ui |
| Charts | Recharts |
| Styling | Tailwind CSS v4 + PostCSS |
| Data fetching | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Authentication | Clerk |
| Language | TypeScript 5 |
| Backend | FastAPI + Pydantic v2 |
| Database | PostgreSQL / SQLite via SQLAlchemy async |
| Migrations | Alembic |
| Background jobs | Celery + Redis |
| PDF generation | ReportLab |
| Containers | Docker Compose |

---

## Pages & Features

| Route | What's there |
|---|---|
| `/overview` | KPI cards, revenue trend, anomaly alerts, key insights |
| `/analytics` | Full analytics — revenue, segments, regions, categories |
| `/data-science` | Future Predictions — forecasting, EDA, anomaly detection, correlations |
| `/customers` | RFM scatter, segment cards, filterable table, CSV import, Add Customer |
| `/customer-analytics` | CLV, churn rate, retention, repeat purchase, growth trend |
| `/customers/[id]` | Customer detail — RFM profile, transaction history, CSV export |
| `/sales` | Revenue trend by period, category breakdown, seasonal heatmap |
| `/marketing` | Acquisition funnel, CAC trend, campaign performance |
| `/products` | Product performance, category breakdown, growth rates |
| `/branches` | Branch performance — 8 stores, 8 countries, attainment vs target |
| `/reports` | Report center — search, type filter, generate PDF, download |
| `/imports` | CSV import history (real DB), new import modal |
| `/data-sources` | 9 data source connectors (CRM, ERP, POS, Web, etc.) |
| `/resumes` | Resume library with AI scoring |
| `/github` | GitHub profile analysis |
| `/activity` | Activity audit log |
| `/organizations` | Multi-org workspace management |
| `/settings/org` | Organization settings |
| `/settings/users` | Team members + invite modal |
| `/profile` | User profile + notification preferences |

---

## API Endpoints

Base URL: `http://localhost:8000` · Interactive docs: `/docs`

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/api/kpis` | Top-line KPI cards |
| GET | `/api/revenue-series` | Monthly revenue vs prior year |
| GET | `/api/category-revenue` | Revenue by product category |
| GET | `/api/seasonal-heatmap` | Weekly × monthly intensity grid |
| GET | `/api/segments` | Customer segments with share |
| GET | `/api/regions` | Regional revenue breakdown |
| GET | `/api/customers` | Paginated customer list (`?segment=&status=&page=&page_size=`) |
| GET | `/api/customers/{id}` | Customer detail |
| GET | `/api/customers/{id}/transactions` | Transaction history |
| POST | `/api/customers` | Create customer manually |
| GET | `/api/funnel` | Acquisition funnel stages |
| GET | `/api/campaigns` | Campaign performance (`?channel=`) |
| GET | `/api/reports` | Paginated report list (`?type=`) |
| GET | `/api/reports/{id}` | Report detail |
| POST | `/api/reports/{id}/generate` | Enqueue PDF generation |
| GET | `/api/jobs/{id}` | Job status + progress |
| GET | `/api/jobs/{id}/download` | Download generated PDF |
| GET | `/api/team-members` | Team member list |
| POST | `/api/import/preview` | Step 1: Upload CSV → get headers + preview |
| POST | `/api/import/customers` | Step 2: Run import with column mappings |
| GET | `/api/import/history` | Real import history from DB |
| GET | `/api/import/fields` | Available import target fields |
| GET | `/api/products` | Product list |
| GET | `/api/products/categories` | Category breakdown |
| GET | `/api/stores` | Branch/store list (`?country=&region=`) |
| GET | `/api/data-sources` | Data source connectors |
| GET | `/api/analytics/forecast` | Revenue forecast (exponential smoothing) |
| GET | `/api/analytics/anomalies` | Z-score anomaly detection |
| GET | `/api/analytics/correlations` | Pearson correlation analysis |
| GET | `/api/analytics/eda` | Full EDA report |
| GET | `/api/customer-analytics` | CLV, churn, retention metrics |

---

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── (dashboard)/          # All dashboard pages
│   │   ├── sign-in/              # Clerk auth
│   │   └── sign-up/
│   ├── components/
│   │   ├── charts/               # RevenueTrendChart, SegmentBars
│   │   ├── csv-import/           # CsvImportModal (drag & drop, mapping, preview)
│   │   ├── customers/            # AddCustomerModal
│   │   ├── dashboard/            # KpiCard, Panel, PageHeader, Skeleton, Pagination
│   │   ├── layout/               # DashboardLayout (responsive sidebar + drawer)
│   │   ├── providers/            # QueryProvider
│   │   └── ui/                   # shadcn/ui primitives
│   ├── features/
│   │   └── reports/api.ts        # TanStack Query hooks for job polling
│   └── lib/
│       ├── api.ts                # ← Single API client (all fetch calls)
│       ├── csv.ts                # CSV export utility
│       ├── formatters.ts
│       └── utils.ts
├── backend/
│   ├── main.py                   # FastAPI app + auto-seed on startup
│   ├── core/                     # Config, auth (Clerk JWT), cache, exceptions
│   ├── db/                       # SQLAlchemy session, Alembic migrations (001–005)
│   ├── models/                   # 12 ORM models (customer, transaction, job, import_log…)
│   ├── schemas/                  # Pydantic response schemas
│   ├── repositories/             # DB query layer (org-scoped)
│   ├── services/                 # Business logic (kpi, revenue, customer, analytics…)
│   ├── analytics/                # Pure functions: RFM, CLV, churn, forecasting, stats
│   ├── workers/                  # Celery tasks + beat schedule (weekly/monthly reports)
│   ├── routers/                  # 15 API routers
│   ├── scripts/                  # seed.py (150 customers), create_admin.py
│   └── tests/                   # 77 tests (unit + integration)
├── start.bat                     # ← Double-click to start everything
├── stop.bat
├── docker-compose.yml
└── public/favicon.svg
```

---

## Authentication

Authentication uses [Clerk](https://clerk.com). Without Clerk keys the app runs in dev mode (no login required).

To enable auth:

1. Create a free app at [dashboard.clerk.com](https://dashboard.clerk.com)
2. Add keys to `.env.local`:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/overview
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/overview
```

3. Add the backend key to `backend/.env`:

```
CLERK_SECRET_KEY=sk_test_...
```

Each user automatically gets their own isolated workspace. Data is fully multi-tenant — no user ever sees another org's data.

---

## CSV Import

1. Go to `/customers` → click **Import CSV**
2. Drag & drop or browse for a `.csv` file (max 10 MB)
3. Preview the first 10 rows
4. Map CSV columns to customer fields
5. Click **Import** — atomic transaction, full rollback on error
6. View history at `/imports`

**Supported fields:** `name*`, `email`, `mrr`, `ltv`, `segment`, `region`, `status`, `joined`

**Sample CSV:**
```csv
name,email,mrr,ltv,segment,region,status,joined
Acme Corp,acme@example.com,5000,120000,Enterprise Growth,North America,Active,2023-01-15
Beta Ltd,beta@example.com,1200,28000,Mid-Market Stable,Europe,At Risk,2023-06-01
```

---

## Database

**Dev (default — zero setup):**
```
DATABASE_URL=sqlite+aiosqlite:///./nexus_dev.db
```
On first start the backend auto-creates all tables and seeds 150 customers, ~2000 transactions, 10 campaigns, 12 months of revenue data.

**Production (PostgreSQL):**
```sh
# Start Postgres
docker run -d --name nexus-pg -e POSTGRES_DB=nexus -e POSTGRES_USER=nexus \
  -e POSTGRES_PASSWORD=nexus -p 5432:5432 postgres:16-alpine

# Update backend/.env
DATABASE_URL=postgresql+asyncpg://nexus:nexus@localhost:5432/nexus

# Run migrations
python -m alembic -c backend/alembic.ini upgrade head

# Seed
python -m backend.scripts.seed
```

---

## Docker (Full Stack)

```sh
docker compose up
```

Starts: Frontend (3000) · Backend (8000) · Postgres (5432) · Redis (6379) · Celery Worker · Celery Beat

First time only:
```sh
docker compose exec backend python -m alembic -c backend/alembic.ini upgrade head
docker compose exec backend python -m backend.scripts.seed
```

---

## Scripts

```sh
# Frontend
npm run dev          # Dev server with Turbopack
npm run build        # Production build
npm run lint         # ESLint
npm run format       # Prettier

# Backend
uvicorn backend.main:app --reload --port 8000   # Dev server
python -m pytest backend/tests -q               # 77 tests
python -m backend.scripts.seed                  # Seed database

# Database
python -m alembic -c backend/alembic.ini upgrade head    # Run migrations
python -m alembic -c backend/alembic.ini current         # Check version
python -m backend.scripts.create_admin --name "Admin" --email admin@example.com --password secret
```

---

## Architecture Notes

**Single API client** — all fetch calls go through `src/lib/api.ts`. No scattered fetch calls anywhere else.

**Seed fallback** — when the DB is empty or unavailable, routers serve seed data transparently. The app is always functional even without a database.

**Multi-tenant** — every data table has `org_id`. Queries are always scoped to the authenticated user's org. A user never sees another org's data.

**Forecasting** — exponential smoothing on real revenue data. Future months show dashed line + confidence band. Historical months show solid line only (no misleading overlap).

**Import history** — every CSV import is logged to the `import_logs` table and displayed in real time at `/imports`.

**Mobile responsive** — sidebar collapses to a drawer on mobile. All pages adapt to small screens.

**Brand color** — change `--brand` in `src/styles.css` to retheme the entire app instantly.
