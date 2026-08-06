"""add_import_logs

Revision ID: 005
Revises: 004
Create Date: 2024-01-05 00:00:00.000000
"""
from __future__ import annotations
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "import_logs",
        sa.Column("id",            sa.String(),                 nullable=False),
        sa.Column("org_id",        sa.String(),                 nullable=False),
        sa.Column("filename",      sa.String(255),              nullable=False, server_default=""),
        sa.Column("rows_imported", sa.Integer(),                nullable=False, server_default="0"),
        sa.Column("rows_skipped",  sa.Integer(),                nullable=False, server_default="0"),
        sa.Column("rows_error",    sa.Integer(),                nullable=False, server_default="0"),
        sa.Column("status",        sa.String(20),               nullable=False, server_default="success"),
        sa.Column("imported_by",   sa.String(255),              nullable=False, server_default=""),
        sa.Column("created_at",    sa.DateTime(timezone=True),  nullable=True,
                  server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["org_id"], ["orgs.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_import_logs_org_id", "import_logs", ["org_id"])


def downgrade() -> None:
    op.drop_table("import_logs")
