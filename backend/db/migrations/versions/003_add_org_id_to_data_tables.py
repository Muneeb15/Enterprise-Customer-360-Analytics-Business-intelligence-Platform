"""add_org_id_to_data_tables

Revision ID: 003
Revises: 002
Create Date: 2024-01-03 00:00:00.000000
"""
from __future__ import annotations
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Default org for existing data
DEFAULT_ORG_ID = "org_acme"


def upgrade() -> None:
    # ── customers ─────────────────────────────────────────────────────────────
    op.add_column("customers", sa.Column("org_id", sa.String(), nullable=True))
    op.execute(f"UPDATE customers SET org_id = '{DEFAULT_ORG_ID}' WHERE org_id IS NULL")
    op.alter_column("customers", "org_id", nullable=False)
    op.create_foreign_key("fk_customers_org_id", "customers", "orgs", ["org_id"], ["id"])
    op.create_index("ix_customers_org_id", "customers", ["org_id"])
    op.create_index("ix_customers_org_segment", "customers", ["org_id", "segment"])
    op.create_index("ix_customers_org_status", "customers", ["org_id", "status"])
    op.create_index("ix_customers_org_region", "customers", ["org_id", "region"])
    # Remove old global unique on email (now unique per org)
    op.drop_constraint("customers_email_key", "customers", type_="unique")

    # ── campaigns ─────────────────────────────────────────────────────────────
    op.add_column("campaigns", sa.Column("org_id", sa.String(), nullable=True))
    op.execute(f"UPDATE campaigns SET org_id = '{DEFAULT_ORG_ID}' WHERE org_id IS NULL")
    op.alter_column("campaigns", "org_id", nullable=False)
    op.create_foreign_key("fk_campaigns_org_id", "campaigns", "orgs", ["org_id"], ["id"])
    op.create_index("ix_campaigns_org_id", "campaigns", ["org_id"])

    # ── campaign_events ───────────────────────────────────────────────────────
    op.add_column("campaign_events", sa.Column("org_id", sa.String(), nullable=True))
    op.execute(f"UPDATE campaign_events SET org_id = '{DEFAULT_ORG_ID}' WHERE org_id IS NULL")
    op.alter_column("campaign_events", "org_id", nullable=False)
    op.create_foreign_key("fk_campaign_events_org_id", "campaign_events", "orgs", ["org_id"], ["id"])
    op.create_index("ix_campaign_events_org_id", "campaign_events", ["org_id"])

    # ── reports ───────────────────────────────────────────────────────────────
    op.add_column("reports", sa.Column("org_id", sa.String(), nullable=True))
    op.execute(f"UPDATE reports SET org_id = '{DEFAULT_ORG_ID}' WHERE org_id IS NULL")
    op.alter_column("reports", "org_id", nullable=False)
    op.create_foreign_key("fk_reports_org_id", "reports", "orgs", ["org_id"], ["id"])
    op.create_index("ix_reports_org_id", "reports", ["org_id"])

    # ── revenue_snapshots ─────────────────────────────────────────────────────
    op.add_column("revenue_snapshots", sa.Column("org_id", sa.String(), nullable=True))
    op.execute(f"UPDATE revenue_snapshots SET org_id = '{DEFAULT_ORG_ID}' WHERE org_id IS NULL")
    op.alter_column("revenue_snapshots", "org_id", nullable=False)
    op.create_foreign_key("fk_revenue_snapshots_org_id", "revenue_snapshots", "orgs", ["org_id"], ["id"])
    op.create_index("ix_revenue_snapshots_org_id", "revenue_snapshots", ["org_id"])
    # Drop old unique constraint and add org-scoped one
    op.drop_constraint("uq_snapshot_period_cat_reg", "revenue_snapshots", type_="unique")
    op.create_unique_constraint(
        "uq_snapshot_org_period_cat_reg",
        "revenue_snapshots",
        ["org_id", "period", "category", "region"],
    )

    # ── seasonal_heatmap ──────────────────────────────────────────────────────
    op.add_column("seasonal_heatmap", sa.Column("org_id", sa.String(), nullable=True))
    op.execute(f"UPDATE seasonal_heatmap SET org_id = '{DEFAULT_ORG_ID}' WHERE org_id IS NULL")
    op.alter_column("seasonal_heatmap", "org_id", nullable=False)
    op.create_foreign_key("fk_seasonal_heatmap_org_id", "seasonal_heatmap", "orgs", ["org_id"], ["id"])
    op.create_index("ix_seasonal_heatmap_org_id", "seasonal_heatmap", ["org_id"])
    op.drop_constraint("uq_heatmap_week_month", "seasonal_heatmap", type_="unique")
    op.create_unique_constraint(
        "uq_heatmap_org_week_month", "seasonal_heatmap", ["org_id", "week", "month"]
    )


def downgrade() -> None:
    for table, fk in [
        ("seasonal_heatmap", "fk_seasonal_heatmap_org_id"),
        ("revenue_snapshots", "fk_revenue_snapshots_org_id"),
        ("reports", "fk_reports_org_id"),
        ("campaign_events", "fk_campaign_events_org_id"),
        ("campaigns", "fk_campaigns_org_id"),
        ("customers", "fk_customers_org_id"),
    ]:
        op.drop_constraint(fk, table, type_="foreignkey")
        op.drop_column(table, "org_id")
