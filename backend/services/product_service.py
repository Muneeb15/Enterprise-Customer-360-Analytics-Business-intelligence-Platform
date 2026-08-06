from __future__ import annotations

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.product import Product as ProductModel, ProductCategory
from backend.schemas.product import Product, CategoryBreakdown, ProductPerformanceSummary
from backend.data.seed import CATEGORY_REVENUE


# Seed product data
SEED_PRODUCTS = [
    Product(id="prod_1", name="Platform Subscription", sku="PLT-001", category="Platform",
            price=4900, units_sold=1004, revenue=4_920_000, growth_pct=14.2, return_rate=0.8, status="Active"),
    Product(id="prod_2", name="Professional Services", sku="SVC-001", category="Services",
            price=3100, units_sold=1006, revenue=3_120_000, growth_pct=8.5, return_rate=1.2, status="Active"),
    Product(id="prod_3", name="Add-on Modules", sku="ADD-001", category="Add-ons",
            price=2200, units_sold=1036, revenue=2_280_000, growth_pct=22.1, return_rate=0.5, status="Active"),
    Product(id="prod_4", name="Enterprise Support", sku="SUP-001", category="Enterprise Support",
            price=1500, units_sold=1026, revenue=1_540_000, growth_pct=5.3, return_rate=0.2, status="Active"),
    Product(id="prod_5", name="Training & Certification", sku="TRN-001", category="Training",
            price=600, units_sold=1038, revenue=622_900, growth_pct=-2.1, return_rate=3.0, status="Active"),
]


async def list_products(db: AsyncSession, org_id: str) -> list[Product]:
    try:
        result = await db.execute(
            select(ProductModel).where(ProductModel.org_id == org_id).order_by(ProductModel.revenue.desc())
        )
        rows = result.scalars().all()
        if rows:
            return [
                Product(
                    id=r.id, name=r.name, sku=r.sku, category=r.category.value,
                    price=r.price, units_sold=r.units_sold, revenue=r.revenue,
                    growth_pct=r.growth_pct, return_rate=r.return_rate, status=r.status,
                )
                for r in rows
            ]
    except Exception:
        pass
    return SEED_PRODUCTS


async def get_category_breakdown(db: AsyncSession, org_id: str) -> list[CategoryBreakdown]:
    products = await list_products(db, org_id)
    total = sum(p.revenue for p in products) or 1
    by_cat: dict[str, dict] = {}
    for p in products:
        c = p.category
        if c not in by_cat:
            by_cat[c] = {"revenue": 0, "units": 0, "growth": []}
        by_cat[c]["revenue"] += p.revenue
        by_cat[c]["units"] += p.units_sold
        by_cat[c]["growth"].append(p.growth_pct)

    return [
        CategoryBreakdown(
            category=cat,
            revenue=d["revenue"],
            units_sold=d["units"],
            share_pct=round(d["revenue"] / total * 100, 1),
            growth_pct=round(sum(d["growth"]) / len(d["growth"]), 1),
        )
        for cat, d in sorted(by_cat.items(), key=lambda x: x[1]["revenue"], reverse=True)
    ]


async def get_summary(db: AsyncSession, org_id: str) -> ProductPerformanceSummary:
    products = await list_products(db, org_id)
    total_rev = sum(p.revenue for p in products)
    top_cat = max(products, key=lambda p: p.revenue).category if products else ""
    avg_growth = sum(p.growth_pct for p in products) / len(products) if products else 0
    return ProductPerformanceSummary(
        total_products=len(products),
        total_revenue=total_rev,
        top_category=top_cat,
        avg_growth_pct=round(avg_growth, 1),
    )
