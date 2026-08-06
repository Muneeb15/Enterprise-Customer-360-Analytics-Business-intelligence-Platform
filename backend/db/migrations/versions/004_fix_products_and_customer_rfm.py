"""fix_products_and_customer_rfm

Revision ID: 004
Revises: 003
Create Date: 2024-01-04 00:00:00.000000

Changes:
- Products table: remove org_id (products are a shared catalog, not per-org)
  and add new columns (sku, price, units_sold, revenue, growth_pct, return_rate, status)
- customer_rfm: ensure customer_id has proper FK to customers table
- Store table: create if not exists
- DataSource table: create if not exists
"""
from __future__ import annotations
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # ── products: drop org_id if it exists, add new columns ──────────────────
    inspector = sa.inspect(conn)
    product_cols = {c["name"] for c in inspector.get_columns("products")}

    if "org_id" in product_cols:
        # Drop FK first if it exists
        try:
            op.drop_constraint("fk_products_org_id", "products", type_="foreignkey")
        except Exception:
            pass
        op.drop_column("products", "org_id")

    for col_name, col_def in [
        ("sku",         sa.Column("sku",         sa.String(100), nullable=False, server_default="")),
        ("price",       sa.Column("price",       sa.Integer(),   nullable=False, server_default="0")),
        ("units_sold",  sa.Column("units_sold",  sa.Integer(),   nullable=False, server_default="0")),
        ("revenue",     sa.Column("revenue",     sa.Integer(),   nullable=False, server_default="0")),
        ("growth_pct",  sa.Column("growth_pct",  sa.Float(),     nullable=False, server_default="0")),
        ("return_rate", sa.Column("return_rate", sa.Float(),     nullable=False, server_default="0")),
        ("status",      sa.Column("status",      sa.String(20),  nullable=False, server_default="Active")),
    ]:
        if col_name not in product_cols:
            op.add_column("products", col_def)

    # ── customer_rfm: add recency_label if missing ────────────────────────────
    rfm_cols = {c["name"] for c in inspector.get_columns("customer_rfm")}
    if "recency_label" not in rfm_cols:
        op.add_column(
            "customer_rfm",
            sa.Column("recency_label", sa.String(50), nullable=False, server_default=""),
        )

    # ── stores table ──────────────────────────────────────────────────────────
    if "stores" not in inspector.get_table_names():
        op.create_table(
            "stores",
            sa.Column("id",             sa.String(),    nullable=False),
            sa.Column("org_id",         sa.String(),    nullable=False),
            sa.Column("name",           sa.String(255), nullable=False),
            sa.Column("code",           sa.String(50),  nullable=False),
            sa.Column("country",        sa.String(100), nullable=False),
            sa.Column("region",         sa.String(100), nullable=False),
            sa.Column("city",           sa.String(100), nullable=False, server_default=""),
            sa.Column("manager",        sa.String(255), nullable=False, server_default=""),
            sa.Column("staff_count",    sa.Integer(),   nullable=False, server_default="0"),
            sa.Column("annual_target",  sa.Integer(),   nullable=False, server_default="0"),
            sa.Column("annual_revenue", sa.Integer(),   nullable=False, server_default="0"),
            sa.Column("customer_count", sa.Integer(),   nullable=False, server_default="0"),
            sa.Column("nps_score",      sa.Float(),     nullable=False, server_default="0"),
            sa.Column("status",         sa.String(20),  nullable=False, server_default="Active"),
            sa.ForeignKeyConstraint(["org_id"], ["orgs.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_stores_org_id",  "stores", ["org_id"])
        op.create_index("ix_stores_country", "stores", ["country"])

    # ── data_sources table ────────────────────────────────────────────────────
    if "data_sources" not in inspector.get_table_names():
        op.create_table(
            "data_sources",
            sa.Column("id",              sa.String(),                 nullable=False),
            sa.Column("org_id",          sa.String(),                 nullable=False),
            sa.Column("name",            sa.String(255),              nullable=False),
            sa.Column("source_type",     sa.String(50),               nullable=False),
            sa.Column("status",          sa.String(20),               nullable=False, server_default="disconnected"),
            sa.Column("last_sync",       sa.DateTime(timezone=True),  nullable=True),
            sa.Column("records_synced",  sa.String(20),               nullable=False, server_default="0"),
            sa.Column("config_json",     sa.Text(),                   nullable=True),
            sa.Column("created_at",      sa.DateTime(timezone=True),  nullable=True,
                      server_default=sa.text("now()")),
            sa.ForeignKeyConstraint(["org_id"], ["orgs.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_data_sources_org_id", "data_sources", ["org_id"])


def downgrade() -> None:
    op.drop_table("data_sources")
    op.drop_table("stores")
