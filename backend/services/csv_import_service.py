"""
CSV import service.

Flow:
  1. Client uploads file → POST /api/import/preview
     validate_csv_upload() decodes and validates the raw bytes.
     Returns headers, first 10 rows, file_id (stored in memory for 10 min).
  2. Client maps columns → POST /api/import/customers
     Validates, detects duplicates, inserts in a single transaction.
     On any validation error the whole import is rolled back.
"""
from __future__ import annotations

import csv
import io
import time
import uuid
from datetime import date, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.customer import Customer, CustomerStatus
from backend.models.revenue_snapshot import CustomerRFM
from backend.schemas.csv_import import (
    ColumnMapping,
    CsvPreviewResponse,
    CsvPreviewRow,
    ImportRequest,
    ImportResult,
    ImportRowError,
)
from backend.analytics.rfm import compute_rfm
from backend.utils.logging import get_logger

logger = get_logger("csv_import_service")

MAX_FILE_BYTES = 10 * 1024 * 1024  # 10 MB

# ── In-memory temp file store with TTL + org isolation ───────────────────────
# Structure: file_id → (content, org_id, expires_monotonic)
_FILE_STORE: dict[str, tuple[str, str, float]] = {}
_MAX_STORE = 200
_FILE_TTL_SECONDS = 600  # 10 minutes


def _evict_expired() -> None:
    now = time.monotonic()
    expired = [k for k, (_, _, exp) in _FILE_STORE.items() if now > exp]
    for k in expired:
        del _FILE_STORE[k]


def store_csv(content: str, org_id: str = "") -> str:
    _evict_expired()
    if len(_FILE_STORE) >= _MAX_STORE:
        oldest = next(iter(_FILE_STORE))
        del _FILE_STORE[oldest]
    file_id = uuid.uuid4().hex
    _FILE_STORE[file_id] = (content, org_id, time.monotonic() + _FILE_TTL_SECONDS)
    return file_id


def get_csv(file_id: str, org_id: str = "") -> str | None:
    """Return content only if file_id belongs to this org and hasn't expired."""
    _evict_expired()
    entry = _FILE_STORE.get(file_id)
    if not entry:
        return None
    content, stored_org, _ = entry
    # Allow if org_id matches or if no org was stored (backward compat)
    if stored_org and org_id and stored_org != org_id:
        return None
    return content


def delete_csv(file_id: str) -> None:
    _FILE_STORE.pop(file_id, None)


# ── File validation (moved from router) ──────────────────────────────────────

class CsvValidationError(ValueError):
    """Raised when the uploaded file cannot be accepted."""


def validate_and_decode(filename: str | None, raw: bytes) -> str:
    """
    Validate filename, size, encoding.
    Returns decoded text content.
    Raises CsvValidationError on any problem.
    """
    if not filename or not filename.lower().endswith(".csv"):
        raise CsvValidationError("Only .csv files are accepted")

    if len(raw) > MAX_FILE_BYTES:
        raise CsvValidationError("File too large (max 10 MB)")

    for encoding in ("utf-8-sig", "utf-8", "latin-1"):
        try:
            content = raw.decode(encoding)
            break
        except UnicodeDecodeError:
            continue
    else:
        raise CsvValidationError("Could not decode file — please use UTF-8 encoding")

    if not content.strip():
        raise CsvValidationError("File is empty")

    return content


# ── Preview ────────────────────────────────────────────────────────────────────

def preview_csv(content: str, org_id: str = "") -> CsvPreviewResponse:
    reader = csv.DictReader(io.StringIO(content))
    headers = reader.fieldnames or []
    rows: list[CsvPreviewRow] = []
    total = 0
    for i, row in enumerate(reader):
        total += 1
        if i < 10:
            rows.append(CsvPreviewRow(row=i + 1, data=dict(row)))
    file_id = store_csv(content, org_id)
    return CsvPreviewResponse(
        headers=list(headers),
        preview_rows=rows,
        total_rows=total,
        file_id=file_id,
    )


# ── Import ─────────────────────────────────────────────────────────────────────

_VALID_STATUSES = {"active", "at risk", "churned"}
_STATUS_MAP = {
    "active": CustomerStatus.active,
    "at risk": CustomerStatus.at_risk,
    "churned": CustomerStatus.churned,
}

_DEFAULT_SEGMENTS = {
    "Enterprise Growth", "Mid-Market Stable",
    "SMB High Churn", "New / Onboarding", "Dormant",
}

_DEFAULT_REGIONS = {"North America", "Europe", "APAC", "LATAM"}


def _parse_int(v: str, field: str, row_num: int, errors: list) -> int | None:
    v = v.strip().replace("$", "").replace(",", "")
    if not v:
        return None
    try:
        return int(float(v))
    except ValueError:
        errors.append(ImportRowError(row=row_num, column=field,
                                     message=f"'{v}' is not a valid number"))
        return None


def _parse_date(v: str, field: str, row_num: int, errors: list) -> date | None:
    v = v.strip()
    if not v:
        return None
    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(v, fmt).date()
        except ValueError:
            continue
    errors.append(ImportRowError(row=row_num, column=field,
                                  message=f"'{v}' is not a recognised date format"))
    return None


async def import_customers(
    db: AsyncSession,
    request: ImportRequest,
    org_id: str,
) -> ImportResult:
    content = get_csv(request.file_id, org_id)
    if not content:
        return ImportResult(imported=0, skipped=0,
                            errors=[ImportRowError(row=0, column=None, message="File not found or expired. Please re-upload the CSV.")])

    # Build mapping dict  csv_col → target_field
    mapping: dict[str, str] = {
        m.csv_column: m.target_field
        for m in request.mappings
        if m.target_field != "__skip__"
    }

    reader = csv.DictReader(io.StringIO(content))

    # Pre-load existing emails for this org (duplicate detection)
    existing_emails_result = await db.execute(
        select(Customer.email).where(
            Customer.org_id == org_id,
            Customer.email.isnot(None),
        )
    )
    existing_emails: set[str] = {r[0].lower() for r in existing_emails_result.all()}

    errors: list[ImportRowError] = []
    to_insert: list[Customer] = []
    skipped = 0
    seen_in_batch: set[str] = set()

    for row_num, raw_row in enumerate(reader, start=1):
        # Map CSV columns to target fields
        mapped: dict[str, str] = {}
        for csv_col, target in mapping.items():
            mapped[target] = raw_row.get(csv_col, "").strip()

        # ── Required: name ───────────────────────────────────────────────────
        name = mapped.get("name", "").strip()
        if not name:
            errors.append(ImportRowError(row=row_num, column="name", message="Name is required"))
            continue

        # ── Duplicate detection ──────────────────────────────────────────────
        email_raw = mapped.get("email", "").strip().lower() or None
        if email_raw:
            if email_raw in existing_emails or email_raw in seen_in_batch:
                skipped += 1
                continue
            seen_in_batch.add(email_raw)

        # ── Numeric fields ───────────────────────────────────────────────────
        mrr = _parse_int(mapped.get("mrr", ""), "mrr", row_num, errors) or 0
        ltv = _parse_int(mapped.get("ltv", ""), "ltv", row_num, errors) or 0

        # ── Status ───────────────────────────────────────────────────────────
        status_raw = mapped.get("status", "active").strip().lower()
        if status_raw and status_raw not in _VALID_STATUSES:
            errors.append(ImportRowError(row=row_num, column="status",
                                          message=f"Unknown status '{status_raw}'. Use Active, At Risk, or Churned"))
            continue
        status = _STATUS_MAP.get(status_raw, CustomerStatus.active)

        # ── Segment / Region (default if missing) ────────────────────────────
        segment = mapped.get("segment", "New / Onboarding").strip() or "New / Onboarding"
        region = mapped.get("region", "North America").strip() or "North America"

        # ── Joined date ──────────────────────────────────────────────────────
        joined = _parse_date(mapped.get("joined", ""), "joined", row_num, errors) or date.today()

        customer = Customer(
            org_id=org_id,
            name=name,
            email=email_raw,
            status=status,
            segment=segment,
            region=region,
            mrr=mrr,
            ltv=ltv,
            frequency=0,
            monetary=min(5, max(1, ltv // 100_000 + 1)),
            joined=joined,
        )
        to_insert.append(customer)

    # ── Abort entire import if validation errors ──────────────────────────────
    if errors:
        delete_csv(request.file_id)
        return ImportResult(imported=0, skipped=skipped, errors=errors, rollback=True)

    # ── Insert all rows in one transaction ────────────────────────────────────
    try:
        for customer in to_insert:
            db.add(customer)
        await db.flush()

        # Compute RFM scores for new customers
        for customer in to_insert:
            rfm = compute_rfm(customer.last_activity, customer.frequency, customer.ltv)
            db.add(CustomerRFM(
                customer_id=customer.id,
                recency_score=rfm.recency_score,
                frequency_score=rfm.frequency_score,
                monetary_score=rfm.monetary_score,
                segment=rfm.segment,
                recency_label=rfm.recency_label,
            ))

        await db.commit()
        delete_csv(request.file_id)
        return ImportResult(imported=len(to_insert), skipped=skipped, errors=[])

    except Exception as exc:
        await db.rollback()
        delete_csv(request.file_id)
        return ImportResult(
            imported=0, skipped=skipped,
            errors=[ImportRowError(row=0, column=None, message=f"Database error: {exc}")],
            rollback=True,
        )
