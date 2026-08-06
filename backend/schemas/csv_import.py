from __future__ import annotations
from typing import Any, Literal
from pydantic import BaseModel


class CsvPreviewRow(BaseModel):
    row: int
    data: dict[str, str]


class CsvPreviewResponse(BaseModel):
    headers: list[str]
    preview_rows: list[CsvPreviewRow]
    total_rows: int
    file_id: str


class ColumnMapping(BaseModel):
    csv_column: str
    target_field: str   # e.g. "name", "email", "mrr" — or "__skip__"


class ImportRequest(BaseModel):
    file_id: str
    mappings: list[ColumnMapping]
    filename: str = "imported.csv"   # optional — used for history logging


class ImportRowError(BaseModel):
    row: int
    column: str | None
    message: str


class ImportResult(BaseModel):
    imported: int
    skipped: int
    errors: list[ImportRowError]
    rollback: bool = False


# Alias used in router response_model
CustomerFieldsResponse = list[dict]

# The fields we accept for Customer import
CUSTOMER_FIELDS: list[dict] = [
    {"key": "name",     "label": "Customer Name",    "required": True},
    {"key": "email",    "label": "Email",             "required": False},
    {"key": "mrr",      "label": "MRR ($)",           "required": False},
    {"key": "ltv",      "label": "Lifetime Value ($)", "required": False},
    {"key": "segment",  "label": "Segment",           "required": False},
    {"key": "region",   "label": "Region",            "required": False},
    {"key": "status",   "label": "Status",            "required": False},
    {"key": "joined",   "label": "Joined Date",       "required": False},
]
