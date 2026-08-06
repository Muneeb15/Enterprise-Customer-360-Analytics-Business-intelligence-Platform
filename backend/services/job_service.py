from __future__ import annotations

import uuid

from fastapi import BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from backend.repositories import report_repo
from backend.schemas.job import Job
from backend.schemas.report import GenerateResponse
from backend.core.config import get_settings
from backend.core.exceptions import NotFoundError, ConflictError
from backend.utils.logging import get_logger

logger = get_logger("job_service")


def _to_schema(j) -> Job:  # noqa: ANN001
    return Job(
        job_id=j.id,
        report_id=j.report_id,
        status=j.status.value,
        progress=j.progress,
        pdf_url=f"/api/jobs/{j.id}/download" if j.status.value == "ready" else None,
        error=j.error,
    )


async def get_job(db: AsyncSession, job_id: str) -> Job:
    job = await report_repo.get_job(db, job_id)
    if not job:
        raise NotFoundError("Job", job_id)
    return _to_schema(job)


async def assert_job_ready(db: AsyncSession, job_id: str) -> str:
    """Returns file_path if ready; raises ConflictError otherwise."""
    job = await report_repo.get_job(db, job_id)
    if not job:
        raise NotFoundError("Job", job_id)
    if job.status.value != "ready" or not job.file_path:
        raise ConflictError("PDF is not ready yet")
    return job.file_path


def start_background_generation(
    job_id: str,
    report_id: str,
    background_tasks: BackgroundTasks,
) -> GenerateResponse:
    """
    Dev-mode fallback: run PDF generation in-process as a BackgroundTask.
    Used when Celery/Redis is not available.
    Stores job state in the in-memory _job_store.
    """
    from backend.routers._job_store import JOBS
    from backend.models.schemas import Job as LegacyJob

    settings = get_settings()
    output_path = str(settings.storage_dir / f"{job_id}.pdf")

    legacy_job = LegacyJob(
        job_id=job_id, report_id=report_id, status="queued", progress=0
    )
    JOBS[job_id] = legacy_job

    def _run() -> None:
        from backend.services.pdf_generator import generate_pdf_blocking
        from backend.routers._job_store import JOBS as _J

        j = _J.get(job_id)
        if not j:
            return
        j.status = "running"
        try:
            generate_pdf_blocking(
                job_id,
                report_id,
                output_path,
                on_progress=lambda p: setattr(j, "progress", p),
            )
            j.status = "ready"
            j.progress = 100
            j.pdf_url = output_path
            logger.info("Dev PDF generation complete: %s", job_id)
        except Exception as exc:  # noqa: BLE001
            j.status = "error"
            j.error = str(exc)[:500]
            logger.error("Dev PDF generation failed: %s – %s", job_id, exc)

    background_tasks.add_task(_run)
    return GenerateResponse(job_id=job_id, status="queued")


async def get_job_from_store(job_id: str) -> Job | None:
    """Read from in-memory dev store (fallback when DB unavailable)."""
    from backend.routers._job_store import JOBS

    legacy = JOBS.get(job_id)
    if not legacy:
        return None
    return Job(
        job_id=legacy.job_id,
        report_id=legacy.report_id,
        status=legacy.status,
        progress=legacy.progress,
        pdf_url=legacy.pdf_url,
        error=legacy.error,
    )
