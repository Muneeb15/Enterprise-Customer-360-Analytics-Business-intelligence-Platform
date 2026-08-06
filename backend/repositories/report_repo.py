from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.report import Report
from backend.models.job import Job, JobStatus


async def get_all(db: AsyncSession, org_id: str, type_filter: str | None = None) -> list[Report]:
    q = select(Report).where(Report.org_id == org_id)
    if type_filter:
        q = q.where(Report.type == type_filter)
    result = await db.execute(q.order_by(Report.updated_at.desc()))
    return list(result.scalars().all())


async def get_by_id(db: AsyncSession, org_id: str, report_id: str) -> Report | None:
    result = await db.execute(
        select(Report).where(Report.id == report_id, Report.org_id == org_id)
    )
    return result.scalar_one_or_none()


async def create_job(db: AsyncSession, report_id: str, job_id: str) -> Job:
    job = Job(id=job_id, report_id=report_id, status=JobStatus.queued, progress=0)
    db.add(job)
    await db.flush()
    return job


async def get_job(db: AsyncSession, job_id: str) -> Job | None:
    result = await db.execute(select(Job).where(Job.id == job_id))
    return result.scalar_one_or_none()


async def update_job(
    db: AsyncSession,
    job_id: str,
    status: JobStatus | None = None,
    progress: int | None = None,
    file_path: str | None = None,
    error: str | None = None,
) -> Job | None:
    job = await get_job(db, job_id)
    if not job:
        return None
    if status is not None:
        job.status = status
    if progress is not None:
        job.progress = progress
    if file_path is not None:
        job.file_path = file_path
    if error is not None:
        job.error = error
    job.updated_at = datetime.now(timezone.utc)
    await db.flush()
    return job
