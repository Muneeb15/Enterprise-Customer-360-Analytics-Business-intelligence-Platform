"""
Python port of src/lib/mock-data.ts.
All values are identical to the TypeScript source — this is the API contract seed.
"""
from __future__ import annotations
import math
from backend.models.schemas import (
    Kpi, RevenuePoint, Segment, Region, Customer, CustomerTransaction,
    CategoryRevenue, HeatmapRow, HeatmapCell, FunnelStage, Campaign, Report, TeamMember,
)

# ── KPIs ──────────────────────────────────────────────────────────────────────

KPIS: list[Kpi] = [
    Kpi(label="Total Revenue",    value="$12,482,900", delta="+14.2%", tone="pos",     hero=True),
    Kpi(label="Active Customers", value="8,241",       delta="+2.4%",  tone="pos"),
    Kpi(label="Churn Rate",       value="1.82%",       delta="-0.4%",  tone="pos"),
    Kpi(label="AOV",              value="$1,514.20",   delta="0.0%",   tone="neutral"),
]

# ── Revenue series ─────────────────────────────────────────────────────────────

REVENUE_SERIES: list[RevenuePoint] = [
    RevenuePoint(month="Jan", revenue=820_000,   prior=720_000),
    RevenuePoint(month="Feb", revenue=910_000,   prior=780_000),
    RevenuePoint(month="Mar", revenue=1_120_000, prior=900_000),
    RevenuePoint(month="Apr", revenue=1_050_000, prior=950_000),
    RevenuePoint(month="May", revenue=1_240_000, prior=1_020_000),
    RevenuePoint(month="Jun", revenue=1_180_000, prior=1_100_000),
    RevenuePoint(month="Jul", revenue=1_340_000, prior=1_150_000),
    RevenuePoint(month="Aug", revenue=1_290_000, prior=1_180_000),
    RevenuePoint(month="Sep", revenue=1_420_000, prior=1_220_000),
    RevenuePoint(month="Oct", revenue=1_380_000, prior=1_280_000),
    RevenuePoint(month="Nov", revenue=1_510_000, prior=1_310_000),
    RevenuePoint(month="Dec", revenue=1_622_000, prior=1_400_000),
]

# ── Segments ───────────────────────────────────────────────────────────────────

SEGMENTS: list[Segment] = [
    Segment(name="Enterprise Growth",  share=42, revenue=5_242_818, count=812),
    Segment(name="Mid-Market Stable",  share=28, revenue=3_495_212, count=1_942),
    Segment(name="SMB High Churn",     share=15, revenue=1_872_435, count=3_104),
    Segment(name="New / Onboarding",   share=10, revenue=1_248_290, count=1_580),
    Segment(name="Dormant",            share=5,  revenue=624_145,   count=803),
]

# ── Regions ────────────────────────────────────────────────────────────────────

REGIONS: list[Region] = [
    Region(name="North America", share=48, revenue=5_991_792),
    Region(name="Europe",        share=27, revenue=3_370_383),
    Region(name="APAC",          share=17, revenue=2_122_093),
    Region(name="LATAM",         share=8,  revenue=998_632),
]

# ── Customers ──────────────────────────────────────────────────────────────────

CUSTOMERS: list[Customer] = [
    Customer(id="cus_vertex",   name="Vertex Systems",      status="Active",   segment="Enterprise Growth",  region="North America", ltv=842_000, mrr=42_100, recency="2h ago",  frequency=128, monetary=5, joined="2021-03-14"),
    Customer(id="cus_omni",     name="Omni Logic",          status="At Risk",  segment="Mid-Market Stable",  region="Europe",        ltv=612_400, mrr=18_400, recency="1d ago",  frequency=92,  monetary=4, joined="2020-11-02"),
    Customer(id="cus_terra",    name="Terra Quartz",        status="Active",   segment="Enterprise Growth",  region="APAC",          ltv=492_000, mrr=24_300, recency="5h ago",  frequency=74,  monetary=5, joined="2022-01-19"),
    Customer(id="cus_helios",   name="Helios Freight",      status="Active",   segment="Mid-Market Stable",  region="North America", ltv=388_400, mrr=12_800, recency="18m ago", frequency=61,  monetary=4, joined="2022-06-30"),
    Customer(id="cus_arden",    name="Arden Biosciences",   status="At Risk",  segment="SMB High Churn",     region="Europe",        ltv=214_800, mrr=4_200,  recency="9d ago",  frequency=22,  monetary=3, joined="2023-02-08"),
    Customer(id="cus_meridian", name="Meridian Retail",     status="Active",   segment="Enterprise Growth",  region="LATAM",         ltv=720_500, mrr=31_900, recency="1h ago",  frequency=104, monetary=5, joined="2021-08-22"),
    Customer(id="cus_kestrel",  name="Kestrel & Co",        status="Churned",  segment="Dormant",            region="North America", ltv=42_100,  mrr=0,      recency="84d ago", frequency=3,   monetary=1, joined="2023-09-11"),
    Customer(id="cus_orbit",    name="Orbit Dynamics",      status="Active",   segment="New / Onboarding",   region="APAC",          ltv=88_200,  mrr=6_400,  recency="3h ago",  frequency=12,  monetary=3, joined="2024-10-01"),
]

# ── Transactions (port of getCustomerTransactions) ─────────────────────────────

def get_customer_transactions(customer_id: str) -> list[CustomerTransaction]:
    import datetime

    seed = sum(ord(c) for c in customer_id)

    def rng(i: int) -> float:
        return abs(math.sin((seed + i) * 12.9898)) % 1

    cats: list[CustomerTransaction.__annotations__["category"]] = [  # type: ignore[index]
        "Billing", "Support", "Contract", "Product", "Expansion",
    ]
    descs = [
        "Monthly subscription",
        "Support ticket resolved",
        "Annual contract renewal",
        "Feature adoption",
        "Expansion — added seats",
        "Overage — API usage",
        "Credit applied",
        "Plan upgraded",
    ]

    txs: list[CustomerTransaction] = []
    today = datetime.date.today()
    for i in range(12):
        days_ago = int(rng(i) * 180)
        d = today - datetime.timedelta(days=days_ago)
        txs.append(CustomerTransaction(
            id=f"{customer_id}_tx_{i}",
            date=d.isoformat(),
            description=descs[i % len(descs)],
            category=cats[i % len(cats)],
            amount=round(rng(i + 7) * 42_000 + 500),
        ))

    txs.sort(key=lambda t: t.date, reverse=True)
    return txs

# ── Category revenue ───────────────────────────────────────────────────────────

CATEGORY_REVENUE: list[CategoryRevenue] = [
    CategoryRevenue(name="Platform",          value=4_920_000),
    CategoryRevenue(name="Services",          value=3_120_000),
    CategoryRevenue(name="Add-ons",           value=2_280_000),
    CategoryRevenue(name="Enterprise Support",value=1_540_000),
    CategoryRevenue(name="Training",          value=622_900),
]

# ── Seasonal heatmap ───────────────────────────────────────────────────────────

def _build_heatmap() -> list[HeatmapRow]:
    months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    weeks  = ["W1","W2","W3","W4"]

    def rng(i: int) -> float:
        return abs(math.sin(i * 12.9898)) % 1

    rows: list[HeatmapRow] = []
    for wi, w in enumerate(weeks):
        cells = [
            HeatmapCell(month=m, intensity=round(rng(wi * 12 + mi) * 100))
            for mi, m in enumerate(months)
        ]
        rows.append(HeatmapRow(week=w, values=cells))
    return rows

SEASONAL_HEATMAP: list[HeatmapRow] = _build_heatmap()

# ── Funnel ─────────────────────────────────────────────────────────────────────

FUNNEL: list[FunnelStage] = [
    FunnelStage(stage="Visitors",        value=128_400),
    FunnelStage(stage="Signups",         value=24_820),
    FunnelStage(stage="Activated",       value=11_240),
    FunnelStage(stage="Paying",          value=4_182),
    FunnelStage(stage="Retained (90d)",  value=3_204),
]

# ── Campaigns ──────────────────────────────────────────────────────────────────

CAMPAIGNS: list[Campaign] = [
    Campaign(id="c1", name="Q4 Enterprise Outbound", channel="Sales",       spend=84_200,  revenue=612_000, roas=7.27,  cac=412),
    Campaign(id="c2", name="APAC Expansion",          channel="Paid Search", spend=128_400, revenue=442_800, roas=3.45,  cac=812),
    Campaign(id="c3", name="Retention Playbook",      channel="Lifecycle",   spend=22_100,  revenue=298_000, roas=13.48, cac=94),
    Campaign(id="c4", name="Vertical: Retail",         channel="Content",     spend=41_800,  revenue=118_200, roas=2.83,  cac=620),
]

# ── Reports ────────────────────────────────────────────────────────────────────

REPORTS: list[Report] = [
    Report(id="rep_q4_2024",        name="Q4 2024 Executive Review",     type="Executive",    updated="2 days ago",  size="4.2 MB", author="Sarah Jenkins"),
    Report(id="rep_churn_nov",      name="November Churn Deep Dive",     type="Retention",    updated="5 days ago",  size="1.8 MB", author="Alex Chen"),
    Report(id="rep_segments_2024",  name="2024 Segmentation Refresh",    type="Segmentation", updated="3 weeks ago", size="6.1 MB", author="M. Osei"),
    Report(id="rep_apac_expansion", name="APAC Expansion Readout",       type="Regional",     updated="1 month ago", size="3.4 MB", author="R. Watanabe"),
    Report(id="rep_marketing_h2",   name="Marketing H2 Attribution",     type="Marketing",    updated="6 weeks ago", size="2.9 MB", author="Alex Chen"),
]

# ── Team members ───────────────────────────────────────────────────────────────

TEAM_MEMBERS: list[TeamMember] = [
    TeamMember(id="u_sarah", name="Sarah Jenkins", email="sarah@acme.com", role="Admin",   lastActive="Now"),
    TeamMember(id="u_alex",  name="Alex Chen",     email="alex@acme.com",  role="Analyst", lastActive="12m ago"),
    TeamMember(id="u_marie", name="Marie Osei",    email="marie@acme.com", role="Analyst", lastActive="3h ago"),
    TeamMember(id="u_ryo",   name="Ryo Watanabe",  email="ryo@acme.com",   role="Viewer",  lastActive="2d ago"),
    TeamMember(id="u_dana",  name="Dana Kim",      email="dana@acme.com",  role="Viewer",  lastActive="5d ago"),
]
