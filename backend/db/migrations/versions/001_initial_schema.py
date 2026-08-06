"""initial_schema

Revision ID: 001
Revises:
Create Date: 2024-01-01 00:00:00.000000
"""
from __future__ import annotations
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── orgs ──────────────────────────────────────────────────────────────────
    op.create_table(
        "orgs",
        sa.Column("id",          sa.String(),       nullable=False),
        sa.Column("name",        sa.String(255),    nullable=False),
        sa.Column("brand_color", sa.String(50),     nullable=True,
                  server_default="oklch(0.6 0.11 189)"),
        sa.PrimaryKeyConstraint("id"),
    )

    # ── team_members ──────────────────────────────────────────────────────────
    op.create_table(
        "team_members",
        sa.Column("id",            sa.String(),    nullable=False),
        sa.Column("org_id",        sa.String(),    nullable=False),
        sa.Column("name",          sa.String(255), nullable=False),
        sa.Column("email",         sa.String(255), nullable=False),
        sa.Column("role",          sa.String(50),  nullable=False, server_default="Viewer"),
        sa.Column("last_active",   sa.String(50),  nullable=True),
        sa.Column("password_hash", sa.String(255), nullable=True),
        sa.ForeignKeyConstraint(["org_id"], ["orgs.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )

    # ── products ──────────────────────────────────────────────────────────────
    op.create_table(
        "products",
        sa.Column("id",       sa.String(),    nullable=False),
        sa.Column("name",     sa.String(255), nullable=False),
        sa.Column("category", sa.String(100), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    # ── customers ─────────────────────────────────────────────────────────────
    op.create_table(
        "customers",
        sa.Column("id",            sa.String(),     nullable=False),
        sa.Column("name",          sa.String(255),  nullable=False),
        sa.Column("email",         sa.String(255),  nullable=True),
        sa.Column("status",        sa.String(20),   nullable=False, server_default="Active"),
        sa.Column("segment",       sa.String(100),  nullable=False, server_default="New / Onboarding"),
        sa.Column("region",        sa.String(100),  nullable=False, server_default="North America"),
        sa.Column("mrr",           sa.Integer(),    nullable=False, server_default="0"),
        sa.Column("ltv",           sa.Integer(),    nullable=False, server_default="0"),
        sa.Column("frequency",     sa.Integer(),    nullable=False, server_default="0"),
        sa.Column("monetary",      sa.Integer(),    nullable=False, server_default="0"),
        sa.Column("last_activity", sa.Date(),       nullable=True),
        sa.Column("joined",        sa.Date(),       nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_customers_segment", "customers", ["segment"])
    op.create_index("ix_customers_status",  "customers", ["status"])
    op.create_index("ix_customers_region",  "customers", ["region"])

    # ── customer_rfm ──────────────────────────────────────────────────────────
    op.create_table(
        "customer_rfm",
        sa.Column("customer_id",     sa.String(),  nullable=False),
        sa.Column("recency_score",   sa.Integer(), nullable=False, server_default="0"),
        sa.Column("frequency_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("monetary_score",  sa.Integer(), nullable=False, server_default="0"),
        sa.Column("segment",         sa.String(100), nullable=False, server_default=""),
        sa.Column("recency_label",   sa.String(50),  nullable=False, server_default=""),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"]),
        sa.PrimaryKeyConstraint("customer_id"),
    )

    # ── transactions ──────────────────────────────────────────────────────────
    op.create_table(
        "transactions",
        sa.Column("id",          sa.String(),    nullable=False),
        sa.Column("customer_id", sa.String(),    nullable=False),
        sa.Column("product_id",  sa.String(),    nullable=True),
        sa.Column("description", sa.String(500), nullable=False, server_default=""),
        sa.Column("category",    sa.String(50),  nullable=False),
        sa.Column("amount",      sa.Integer(),   nullable=False),
        sa.Column("occurred_at", sa.Date(),      nullable=False),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"]),
        sa.ForeignKeyConstraint(["product_id"],  ["products.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_transactions_customer", "transactions", ["customer_id"])
    op.create_index("ix_transactions_date",     "transactions", ["occurred_at"])

    # ── campaigns ─────────────────────────────────────────────────────────────
    op.create_table(
        "campaigns",
        sa.Column("id",         sa.String(),                       nullable=False),
        sa.Column("name",       sa.String(255),                    nullable=False),
        sa.Column("channel",    sa.String(100),                    nullable=False),
        sa.Column("spend",      sa.Integer(),                      nullable=False, server_default="0"),
        sa.Column("revenue",    sa.Integer(),                      nullable=False, server_default="0"),
        sa.Column("roas",       sa.Float(),                        nullable=False, server_default="0"),
        sa.Column("cac",        sa.Integer(),                      nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True),        nullable=True,
                  server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )

    # ── campaign_events ───────────────────────────────────────────────────────
    op.create_table(
        "campaign_events",
        sa.Column("id",          sa.String(),                nullable=False),
        sa.Column("campaign_id", sa.String(),                nullable=False),
        sa.Column("customer_id", sa.String(),                nullable=True),
        sa.Column("event_type",  sa.String(100),             nullable=False),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=True,
                  server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["campaign_id"], ["campaigns.id"]),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_campaign_events_type", "campaign_events", ["event_type"])

    # ── revenue_snapshots ─────────────────────────────────────────────────────
    op.create_table(
        "revenue_snapshots",
        sa.Column("id",            sa.String(),  nullable=False),
        sa.Column("period",        sa.String(7), nullable=False),
        sa.Column("month_label",   sa.String(3), nullable=False),
        sa.Column("category",      sa.String(100), nullable=True),
        sa.Column("region",        sa.String(100), nullable=True),
        sa.Column("gross_revenue", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("prior_revenue", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("bookings",      sa.Integer(), nullable=False, server_default="0"),
        sa.Column("expansion_mrr", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("share",         sa.Float(),   nullable=False, server_default="0"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("period", "category", "region", name="uq_snapshot_period_cat_reg"),
    )

    # ── seasonal_heatmap ──────────────────────────────────────────────────────
    op.create_table(
        "seasonal_heatmap",
        sa.Column("id",        sa.String(), nullable=False),
        sa.Column("week",      sa.String(3), nullable=False),
        sa.Column("month",     sa.String(3), nullable=False),
        sa.Column("intensity", sa.Integer(), nullable=False, server_default="0"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("week", "month", name="uq_heatmap_week_month"),
    )

    # ── reports ───────────────────────────────────────────────────────────────
    op.create_table(
        "reports",
        sa.Column("id",         sa.String(),                 nullable=False),
        sa.Column("name",       sa.String(255),              nullable=False),
        sa.Column("type",       sa.String(100),              nullable=False),
        sa.Column("author",     sa.String(255),              nullable=False, server_default=""),
        sa.Column("size",       sa.String(20),               nullable=False, server_default="0 MB"),
        sa.Column("created_at", sa.DateTime(timezone=True),  nullable=True,
                  server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True),  nullable=True,
                  server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )

    # ── jobs ──────────────────────────────────────────────────────────────────
    op.create_table(
        "jobs",
        sa.Column("id",         sa.String(),                nullable=False),
        sa.Column("report_id",  sa.String(),                nullable=False),
        sa.Column("status",     sa.String(20),              nullable=False, server_default="queued"),
        sa.Column("progress",   sa.Integer(),               nullable=False, server_default="0"),
        sa.Column("file_path",  sa.String(500),             nullable=True),
        sa.Column("error",      sa.String(500),             nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True,
                  server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True,
                  server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["report_id"], ["reports.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_jobs_report_id", "jobs", ["report_id"])
    op.create_index("ix_jobs_status",    "jobs", ["status"])


def downgrade() -> None:
    op.drop_table("jobs")
    op.drop_table("reports")
    op.drop_table("seasonal_heatmap")
    op.drop_table("revenue_snapshots")
    op.drop_table("campaign_events")
    op.drop_table("campaigns")
    op.drop_table("transactions")
    op.drop_table("customer_rfm")
    op.drop_table("customers")
    op.drop_table("products")
    op.drop_table("team_members")
    op.drop_table("orgs")
