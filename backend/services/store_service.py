from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.store import Store as StoreModel
from backend.schemas.store import Store, BranchPerformanceSummary

SEED_STORES = [
    Store(id="s1",  name="New York Flagship",  code="NYC-001", country="USA",     region="North America", city="New York",    manager="James Okafor",  staff_count=45, annual_target=8_000_000, annual_revenue=8_420_000, customer_count=12400, nps_score=72.0, status="Active", attainment_pct=105.3),
    Store(id="s2",  name="London Central",      code="LDN-001", country="UK",      region="Europe",        city="London",     manager="Sarah Chen",    staff_count=38, annual_target=6_500_000, annual_revenue=6_120_000, customer_count=9800,  nps_score=68.0, status="Active", attainment_pct=94.2),
    Store(id="s3",  name="Tokyo Shibuya",       code="TKY-001", country="Japan",   region="APAC",          city="Tokyo",      manager="Ryo Watanabe", staff_count=52, annual_target=7_000_000, annual_revenue=7_890_000, customer_count=14200, nps_score=81.0, status="Active", attainment_pct=112.7),
    Store(id="s4",  name="Dubai Mall",          code="DXB-001", country="UAE",     region="APAC",          city="Dubai",      manager="Priya Nair",   staff_count=29, annual_target=4_000_000, annual_revenue=3_640_000, customer_count=6100,  nps_score=65.0, status="Active", attainment_pct=91.0),
    Store(id="s5",  name="São Paulo Centro",    code="SAO-001", country="Brazil",  region="LATAM",         city="São Paulo",  manager="Carlos Lima",  staff_count=33, annual_target=3_500_000, annual_revenue=3_820_000, customer_count=7200,  nps_score=70.0, status="Active", attainment_pct=109.1),
    Store(id="s6",  name="Paris Champs-Élysées",code="PAR-001", country="France",  region="Europe",        city="Paris",      manager="Marie Osei",   staff_count=41, annual_target=5_500_000, annual_revenue=5_210_000, customer_count=8900,  nps_score=74.0, status="Active", attainment_pct=94.7),
    Store(id="s7",  name="Sydney CBD",          code="SYD-001", country="Australia",region="APAC",         city="Sydney",     manager="Liam Walsh",   staff_count=27, annual_target=3_000_000, annual_revenue=3_150_000, customer_count=5400,  nps_score=76.0, status="Active", attainment_pct=105.0),
    Store(id="s8",  name="Toronto Downtown",    code="TOR-001", country="Canada",  region="North America", city="Toronto",   manager="Dana Kim",     staff_count=31, annual_target=3_800_000, annual_revenue=3_480_000, customer_count=6800,  nps_score=69.0, status="Active", attainment_pct=91.6),
]


async def list_stores(db: AsyncSession, org_id: str, country: str | None = None, region: str | None = None) -> list[Store]:
    try:
        q = select(StoreModel).where(StoreModel.org_id == org_id)
        if country:
            q = q.where(StoreModel.country == country)
        if region:
            q = q.where(StoreModel.region == region)
        result = await db.execute(q.order_by(StoreModel.annual_revenue.desc()))
        rows = result.scalars().all()
        if rows:
            return [
                Store(
                    id=r.id, name=r.name, code=r.code, country=r.country,
                    region=r.region, city=r.city, manager=r.manager,
                    staff_count=r.staff_count, annual_target=r.annual_target,
                    annual_revenue=r.annual_revenue, customer_count=r.customer_count,
                    nps_score=r.nps_score, status=r.status,
                    attainment_pct=round(r.annual_revenue / r.annual_target * 100, 1) if r.annual_target else 0,
                )
                for r in rows
            ]
    except Exception:
        pass

    stores = SEED_STORES
    if country:
        stores = [s for s in stores if s.country == country]
    if region:
        stores = [s for s in stores if s.region == region]
    return stores


async def get_summary(db: AsyncSession, org_id: str) -> BranchPerformanceSummary:
    stores = await list_stores(db, org_id)
    total_rev = sum(s.annual_revenue for s in stores)
    avg_att = sum(s.attainment_pct for s in stores) / len(stores) if stores else 0
    top = max(stores, key=lambda s: s.annual_revenue).name if stores else ""
    countries = len({s.country for s in stores})
    return BranchPerformanceSummary(
        total_stores=len(stores),
        total_revenue=total_rev,
        avg_attainment=round(avg_att, 1),
        top_store=top,
        countries=countries,
    )
