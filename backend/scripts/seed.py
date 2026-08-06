"""
Database seeder — inserts realistic demo data into Postgres.

Usage (from project root):
    python -m backend.scripts.seed

Generates:
  - 1 org, 5 team members
  - 150 customers across 5 segments and 4 regions
  - ~2 000 transactions (avg 13–14 per customer)
  - 10 campaigns with funnel events
  - 12 months of revenue_snapshot (total + per-category + per-region)
  - Seasonal heatmap (4 weeks × 12 months)
  - 5 reports
  - CustomerRFM scores for all customers
"""
from __future__ import annotations

import asyncio
import math
import random
import uuid
from datetime import date, datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from backend.core.config import get_settings

# Register all models with Base.metadata before create_all
import backend.models.org                # noqa: F401
import backend.models.team_member        # noqa: F401
import backend.models.customer           # noqa: F401
import backend.models.product            # noqa: F401
import backend.models.transaction        # noqa: F401
import backend.models.campaign           # noqa: F401
import backend.models.revenue_snapshot   # noqa: F401
import backend.models.report             # noqa: F401
import backend.models.job                # noqa: F401

from backend.db.base import Base
from backend.models.org import Org
from backend.models.team_member import TeamMember
from backend.models.customer import Customer, CustomerStatus
from backend.models.product import Product, ProductCategory
from backend.models.transaction import Transaction, TransactionCategory
from backend.models.campaign import Campaign, CampaignEvent
from backend.models.revenue_snapshot import RevenueSnapshot, SeasonalHeatmap, CustomerRFM
from backend.models.report import Report
from backend.analytics.rfm import compute_rfm
from backend.analytics.seasonal import _seed_heatmap

random.seed(42)


# ── Constants ──────────────────────────────────────────────────────────────────

SEGMENTS = [
    ("Enterprise Growth",  0.28, (30_000, 60_000), (400_000, 900_000)),
    ("Mid-Market Stable",  0.32, (8_000, 22_000),  (150_000, 650_000)),
    ("SMB High Churn",     0.20, (1_500, 7_000),   (15_000, 180_000)),
    ("New / Onboarding",   0.13, (500, 4_000),     (500, 40_000)),
    ("Dormant",            0.07, (0, 200),          (500, 25_000)),
]

REGIONS = [
    ("North America", 0.48),
    ("Europe",        0.27),
    ("APAC",          0.17),
    ("LATAM",         0.08),
]

CAMPAIGN_DATA = [
    ("Q4 Enterprise Outbound",   "Sales",       84_200,  612_000, 7.27,  412),
    ("APAC Expansion",           "Paid Search", 128_400, 442_800, 3.45,  812),
    ("Retention Playbook",       "Lifecycle",   22_100,  298_000, 13.48,  94),
    ("Vertical: Retail",         "Content",     41_800,  118_200, 2.83,  620),
    ("Q1 SMB Blitz",             "Paid Search",  55_000,  190_000, 3.45,  540),
    ("Enterprise Nurture",       "Lifecycle",   18_500,  310_000, 16.76,  72),
    ("LATAM Launch",             "Paid Search",  42_000,   98_000, 2.33,  920),
    ("Mid-Market Outbound",      "Sales",        71_000,  430_000, 6.06,  310),
    ("Content SEO Q2",           "Content",      28_000,   82_000, 2.93,  480),
    ("Win-Back Campaign",        "Lifecycle",   12_000,  156_000, 13.00,  88),
]

MONTHS = [
    ("2024-01","Jan"),("2024-02","Feb"),("2024-03","Mar"),("2024-04","Apr"),
    ("2024-05","May"),("2024-06","Jun"),("2024-07","Jul"),("2024-08","Aug"),
    ("2024-09","Sep"),("2024-10","Oct"),("2024-11","Nov"),("2024-12","Dec"),
]

REVENUE_BY_MONTH = [
    820_000, 910_000, 1_120_000, 1_050_000, 1_240_000, 1_180_000,
    1_340_000, 1_290_000, 1_420_000, 1_380_000, 1_510_000, 1_622_000,
]
PRIOR_BY_MONTH = [
    720_000, 780_000, 900_000, 950_000, 1_020_000, 1_100_000,
    1_150_000, 1_180_000, 1_220_000, 1_280_000, 1_310_000, 1_400_000,
]

CATEGORY_SPLIT = {
    "Platform":          0.394,
    "Services":          0.250,
    "Add-ons":           0.183,
    "Enterprise Support":0.123,
    "Training":          0.050,
}

FIRST_NAMES = [
    "Alice","Bob","Carol","David","Elena","Frank","Grace","Henry","Iris",
    "James","Karen","Leo","Maya","Nathan","Olivia","Peter","Quinn","Rachel",
    "Sam","Tina","Uma","Victor","Wendy","Xander","Yara","Zane","Aria","Blake",
    "Cameron","Diana","Ethan","Fiona","George","Hana","Ivan","Julia","Kyle",
    "Luna","Marcus","Nina","Oscar","Priya","Ravi","Sofia","Tyler","Ursula",
]

COMPANY_SUFFIXES = [
    "Systems","Logic","Quartz","Freight","Biosciences","Retail","Dynamics",
    "Analytics","Solutions","Tech","Global","Digital","Labs","Group","Hub",
    "Networks","Ventures","Partners","Industries","AI","Cloud","Data","Ops",
]

TX_DESCS = [
    "Monthly subscription", "Support ticket resolved",
    "Annual contract renewal", "Feature adoption",
    "Expansion — added seats", "Overage — API usage",
    "Credit applied", "Plan upgraded", "Onboarding fee",
    "Custom integration", "Training session", "Premium support",
]


def _rand_company() -> str:
    f = random.choice(FIRST_NAMES)
    s = random.choice(COMPANY_SUFFIXES)
    return f"{f} {s}"


def _pick_weighted(choices: list[tuple]) -> tuple:
    """choices = list of (item, weight) tuples."""
    items, weights = zip(*choices)
    return random.choices(items, weights=weights, k=1)[0]


async def main() -> None:
    settings = get_settings()
    engine = create_async_engine(settings.database_url, echo=False)
    SessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        print("✓ Tables created")

    async with SessionLocal() as db:

        # ── Org ────────────────────────────────────────────────────────────────
        org = Org(id="org_acme", name="Acme Global")
        db.add(org)
        # Flush org first so all FK references to org_acme resolve
        await db.flush()

        # ── Team members ───────────────────────────────────────────────────────
        db.add_all([
            TeamMember(id="u_sarah", org_id="org_acme", name="Sarah Jenkins", email="sarah@acme.com", role="Admin",   last_active="Now"),
            TeamMember(id="u_alex",  org_id="org_acme", name="Alex Chen",     email="alex@acme.com",  role="Analyst", last_active="12m ago"),
            TeamMember(id="u_marie", org_id="org_acme", name="Marie Osei",    email="marie@acme.com", role="Analyst", last_active="3h ago"),
            TeamMember(id="u_ryo",   org_id="org_acme", name="Ryo Watanabe",  email="ryo@acme.com",   role="Viewer",  last_active="2d ago"),
            TeamMember(id="u_dana",  org_id="org_acme", name="Dana Kim",      email="dana@acme.com",  role="Viewer",  last_active="5d ago"),
        ])

        # ── Products ───────────────────────────────────────────────────────────
        products = [
            Product(id="prod_platform", name="Platform Subscription",   category=ProductCategory.platform),
            Product(id="prod_services", name="Professional Services",    category=ProductCategory.services),
            Product(id="prod_addons",   name="Add-on Modules",           category=ProductCategory.addons),
            Product(id="prod_support",  name="Enterprise Support",       category=ProductCategory.enterprise_support),
            Product(id="prod_training", name="Training & Certification", category=ProductCategory.training),
        ]
        db.add_all(products)
        # Flush products so transactions can reference them by FK
        await db.flush()
        prod_ids = [p.id for p in products]

        # ── 150 Customers ──────────────────────────────────────────────────────
        customers: list[Customer] = []
        seen_names: set[str] = set()

        seg_weights = [(s[0], s[1]) for s in SEGMENTS]
        reg_weights = [(r[0], r[1]) for r in REGIONS]
        seg_mrr     = {s[0]: s[2] for s in SEGMENTS}
        seg_ltv     = {s[0]: s[3] for s in SEGMENTS}

        for i in range(150):
            seg_name = _pick_weighted(seg_weights)
            region   = _pick_weighted(reg_weights)

            name = _rand_company()
            while name in seen_names:
                name = _rand_company()
            seen_names.add(name)

            mrr_lo, mrr_hi = seg_mrr[seg_name]
            ltv_lo, ltv_hi = seg_ltv[seg_name]
            mrr = random.randint(mrr_lo, mrr_hi)
            ltv = random.randint(max(ltv_lo, mrr * 3), ltv_hi + mrr * 12)

            days_inactive = random.randint(0, 120)
            if seg_name == "Dormant":
                days_inactive = random.randint(60, 365)
            elif seg_name == "SMB High Churn":
                days_inactive = random.randint(10, 90)
            elif seg_name == "Enterprise Growth":
                days_inactive = random.randint(0, 7)

            last_activity = date.today() - timedelta(days=days_inactive)
            if mrr == 0:
                status = CustomerStatus.churned
            elif days_inactive >= 60:
                status = CustomerStatus.churned
            elif days_inactive >= 14:
                status = CustomerStatus.at_risk
            else:
                status = CustomerStatus.active

            joined = date.today() - timedelta(days=random.randint(180, 1500))
            freq = random.randint(2, 140)

            cid = f"cus_{uuid.uuid4().hex[:8]}"
            c = Customer(
                id=cid,
                org_id="org_acme",
                name=name,
                email=f"{name.lower().replace(' ', '.').replace('&', 'and')}@example.com",
                status=status,
                segment=seg_name,
                region=region,
                mrr=mrr,
                ltv=ltv,
                frequency=freq,
                monetary=min(5, max(1, ltv // 100_000 + 1)),
                last_activity=last_activity,
                joined=joined,
            )
            customers.append(c)

        db.add_all(customers)
        # Flush customers so RFM and transaction FKs resolve
        await db.flush()

        # ── CustomerRFM scores ─────────────────────────────────────────────────
        for c in customers:
            rfm = compute_rfm(c.last_activity, c.frequency, c.ltv)
            db.add(CustomerRFM(
                customer_id=c.id,
                recency_score=rfm.recency_score,
                frequency_score=rfm.frequency_score,
                monetary_score=rfm.monetary_score,
                segment=rfm.segment,
                recency_label=rfm.recency_label,
            ))
        await db.flush()

        # ── Transactions (~2 000 total, ~13 per customer) ─────────────────────
        tx_cats = list(TransactionCategory)
        for c in customers:
            n_tx = random.randint(8, 20)
            for j in range(n_tx):
                days_ago = random.randint(0, 540)
                db.add(Transaction(
                    id=f"{c.id}_tx_{j}",
                    customer_id=c.id,
                    product_id=random.choice(prod_ids),
                    description=random.choice(TX_DESCS),
                    category=random.choice(tx_cats),
                    amount=random.randint(500, min(50_000, c.mrr * 2 + 1000)),
                    occurred_at=date.today() - timedelta(days=days_ago),
                ))

        # ── Campaigns (10) ─────────────────────────────────────────────────────
        campaigns: list[Campaign] = []
        for idx, (name, channel, spend, revenue, roas, cac) in enumerate(CAMPAIGN_DATA):
            cid = f"c{idx + 1}"
            campaigns.append(Campaign(
                id=cid, org_id="org_acme", name=name, channel=channel,
                spend=spend, revenue=revenue, roas=roas, cac=cac,
            ))
        db.add_all(campaigns)
        # Flush campaigns so campaign_events can reference them
        await db.flush()
        funnel_counts = [
            ("visitor",  128_400),
            ("signup",    24_820),
            ("activated", 11_240),
            ("paying",     4_182),
            ("retained",   3_204),
        ]
        for event_type, count in funnel_counts:
            sample = min(count, 100)
            for _ in range(sample):
                db.add(CampaignEvent(
                    org_id="org_acme",
                    campaign_id=random.choice(campaigns).id,
                    event_type=event_type,
                ))

        # ── Revenue snapshots (12 months, totals) ─────────────────────────────
        total_annual = sum(REVENUE_BY_MONTH)
        for idx, (period, label) in enumerate(MONTHS):
            rev   = REVENUE_BY_MONTH[idx]
            prior = PRIOR_BY_MONTH[idx]
            # Monthly total
            db.add(RevenueSnapshot(
                org_id="org_acme",
                period=period, month_label=label,
                gross_revenue=rev, prior_revenue=prior,
                share=round(rev / total_annual * 100, 1),
            ))
            # Per-category for the latest month
            if idx == 11:
                for cat, pct in CATEGORY_SPLIT.items():
                    db.add(RevenueSnapshot(
                        org_id="org_acme",
                        period=period, month_label=label,
                        category=cat,
                        gross_revenue=round(rev * pct),
                        prior_revenue=round(prior * pct),
                        share=round(pct * 100, 1),
                    ))
            # Per-region for the latest month
            if idx == 11:
                for reg_name, reg_share in REGIONS:
                    db.add(RevenueSnapshot(
                        org_id="org_acme",
                        period=period, month_label=label,
                        region=reg_name,
                        gross_revenue=round(rev * reg_share),
                        prior_revenue=round(prior * reg_share),
                        share=round(reg_share * 100, 1),
                    ))

        # ── Seasonal heatmap ───────────────────────────────────────────────────
        months_labels = [m[1] for m in MONTHS]
        for row in _seed_heatmap(["W1","W2","W3","W4"], months_labels):
            for cell in row["values"]:
                db.add(SeasonalHeatmap(
                    org_id="org_acme",
                    week=row["week"], month=cell["month"], intensity=cell["intensity"],
                ))

        # ── Reports ────────────────────────────────────────────────────────────
        report_data = [
            ("rep_q4_2024",        "Q4 2024 Executive Review",   "Executive",    "Sarah Jenkins", "4.2 MB", 2),
            ("rep_churn_nov",      "November Churn Deep Dive",    "Retention",    "Alex Chen",     "1.8 MB", 5),
            ("rep_segments_2024",  "2024 Segmentation Refresh",   "Segmentation", "M. Osei",       "6.1 MB", 21),
            ("rep_apac_expansion", "APAC Expansion Readout",      "Regional",     "R. Watanabe",   "3.4 MB", 30),
            ("rep_marketing_h2",   "Marketing H2 Attribution",    "Marketing",    "Alex Chen",     "2.9 MB", 42),
        ]
        for rid, name, rtype, author, size, days_old in report_data:
            db.add(Report(
                id=rid, org_id="org_acme", name=name, type=rtype, author=author, size=size,
                updated_at=datetime.now(timezone.utc) - timedelta(days=days_old),
                created_at=datetime.now(timezone.utc) - timedelta(days=days_old + 1),
            ))

        await db.commit()

    await engine.dispose()

    cust_count = len(customers)
    tx_count   = sum(1 for c in customers for _ in range(1))  # approx
    print(f"✓ Seeded: {cust_count} customers, ~{cust_count * 13} transactions, "
          f"{len(campaigns)} campaigns, {len(MONTHS)} revenue months, "
          f"5 reports")
    print("  Run: uvicorn backend.main:app --reload --port 8000")
    print("  Then: GET http://localhost:8000/api/kpis")


if __name__ == "__main__":
    asyncio.run(main())
