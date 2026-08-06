from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.data_source import DataSource as DataSourceModel
from backend.schemas.data_source import DataSource, DataSourceSummary

SOURCE_DESCRIPTIONS = {
    "crm":     "Customer Relationship Management — contacts, deals, pipeline",
    "erp":     "Enterprise Resource Planning — finance, inventory, HR",
    "pos":     "Point of Sale — in-store transactions and receipts",
    "web":     "Website Analytics — sessions, conversions, funnels",
    "mobile":  "Mobile App — user events, in-app purchases, retention",
    "support": "Customer Support — tickets, NPS, satisfaction scores",
    "email":   "Email Marketing — campaigns, open rates, click-through",
    "payment": "Payment Gateway — transactions, refunds, chargebacks",
    "social":  "Social Media — reach, engagement, sentiment",
}

SEED_SOURCES = [
    DataSource(id="ds_crm",     name="Salesforce CRM",         source_type="crm",     status="connected",    last_sync="2h ago",  records_synced="24,820",  description=SOURCE_DESCRIPTIONS["crm"]),
    DataSource(id="ds_erp",     name="SAP ERP",                source_type="erp",     status="connected",    last_sync="6h ago",  records_synced="8,412",   description=SOURCE_DESCRIPTIONS["erp"]),
    DataSource(id="ds_pos",     name="Square POS",             source_type="pos",     status="connected",    last_sync="1h ago",  records_synced="142,000", description=SOURCE_DESCRIPTIONS["pos"]),
    DataSource(id="ds_web",     name="Google Analytics 4",     source_type="web",     status="connected",    last_sync="30m ago", records_synced="1,240,000",description=SOURCE_DESCRIPTIONS["web"]),
    DataSource(id="ds_mobile",  name="Firebase (Mobile App)",  source_type="mobile",  status="connected",    last_sync="45m ago", records_synced="380,000", description=SOURCE_DESCRIPTIONS["mobile"]),
    DataSource(id="ds_support", name="Zendesk Support",        source_type="support", status="disconnected", last_sync=None,       records_synced="0",       description=SOURCE_DESCRIPTIONS["support"]),
    DataSource(id="ds_email",   name="Mailchimp Campaigns",    source_type="email",   status="connected",    last_sync="4h ago",  records_synced="92,400",  description=SOURCE_DESCRIPTIONS["email"]),
    DataSource(id="ds_payment", name="Stripe Payments",        source_type="payment", status="connected",    last_sync="15m ago", records_synced="200,000", description=SOURCE_DESCRIPTIONS["payment"]),
    DataSource(id="ds_social",  name="Social Analytics Hub",   source_type="social",  status="error",        last_sync="2d ago",  records_synced="48,200",  description=SOURCE_DESCRIPTIONS["social"]),
]


async def list_sources(db: AsyncSession, org_id: str) -> list[DataSource]:
    try:
        result = await db.execute(
            select(DataSourceModel).where(DataSourceModel.org_id == org_id)
        )
        rows = result.scalars().all()
        if rows:
            return [
                DataSource(
                    id=r.id, name=r.name, source_type=r.source_type,
                    status=r.status,
                    last_sync=r.last_sync.strftime("%Y-%m-%d %H:%M") if r.last_sync else None,
                    records_synced=r.records_synced,
                    description=SOURCE_DESCRIPTIONS.get(r.source_type, ""),
                )
                for r in rows
            ]
    except Exception:
        pass
    return SEED_SOURCES


async def get_summary(db: AsyncSession, org_id: str) -> DataSourceSummary:
    sources = await list_sources(db, org_id)
    connected = sum(1 for s in sources if s.status == "connected")
    last = next((s.last_sync for s in sources if s.last_sync), None)
    return DataSourceSummary(total=len(sources), connected=connected, last_sync=last)
