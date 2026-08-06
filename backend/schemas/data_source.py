from __future__ import annotations
from pydantic import BaseModel


class DataSource(BaseModel):
    id: str
    name: str
    source_type: str
    status: str
    last_sync: str | None
    records_synced: str
    description: str


class DataSourceSummary(BaseModel):
    total: int
    connected: int
    last_sync: str | None
