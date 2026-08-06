"""add_clerk_user_id_to_team_members

Revision ID: 002
Revises: 001
Create Date: 2024-01-02 00:00:00.000000
"""
from __future__ import annotations
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "team_members",
        sa.Column("clerk_user_id", sa.String(255), nullable=True),
    )
    op.create_unique_constraint("uq_team_members_clerk_user_id", "team_members", ["clerk_user_id"])
    op.create_index("ix_team_members_clerk_user_id", "team_members", ["clerk_user_id"])


def downgrade() -> None:
    op.drop_index("ix_team_members_clerk_user_id", table_name="team_members")
    op.drop_constraint("uq_team_members_clerk_user_id", "team_members")
    op.drop_column("team_members", "clerk_user_id")
