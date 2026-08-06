from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from backend.repositories import report_repo
from backend.schemas.report import Report, GenerateResponse
from backend.core.exceptions import NotFoundError


def _fmt_updated(dt: datetime) -> str:
    now = datetime.now(timezone.utc)
    delta = now - dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else now - dt
    days = delta.days
    if days == 0: return "Today"
    if days == 1: return "1 day ago"
    if days < 7: return f"{days} days ago"
    if days < 30: return f"{days // 7} weeks ago"
    if days < 365: return f"{days // 30} months ago"
    return f"{days // 365} years ago"


def _to_schema(r) -> Report:  # noqa: ANN001
    return Report(id=r.id, name=r.name, type=r.type,
                  updated=_fmt_updated(r.updated_at), size=r.size, author=r.author)


async def list_reports(db: AsyncSession, org_id: str, type_filter: str | None = None) -> list[Report]:
    rows = await report_repo.get_all(db, org_id=org_id, type_filter=type_filter)
    return [_to_schema(r) for r in rows]


async def get_report(db: AsyncSession, org_id: str, report_id: str) -> Report:
    row = await report_repo.get_by_id(db, org_id=org_id, report_id=report_id)
    if not row:
        raise NotFoundError("Report", report_id)
    return _to_schema(row)


async def enqueue_generation(db: AsyncSession, org_id: str, report_id: str, job_id: str) -> GenerateResponse:
    if not await report_repo.get_by_id(db, org_id=org_id, report_id=report_id):
        raise NotFoundError("Report", report_id)
    await report_repo.create_job(db, report_id, job_id)
    return GenerateResponse(job_id=job_id, status="queued")
