"""
Celery tasks — run in a separate worker process, not inside the FastAPI server.

generate_report_task:
  1. Updates job row to status=running in Postgres
  2. Generates the PDF (calls services/pdf_generator.py)
  3. Updates job row to status=ready with file_path
  4. On any failure, sets status=error with the error message
"""
from __future__ import annotations

import asyncio
import uuid
from pathlib import Path

from backend.workers.celery_app import celery_app
from backend.core.config import get_settings


@celery_app.task(bind=True, name="nexus.generate_report", max_retries=2, default_retry_delay=30)
def generate_report_task(self, job_id: str, report_id: str) -> dict:  # type: ignore[override]
    """
    Celery task wrapper — runs synchronous code (PDF gen is CPU-bound / blocking).
    DB updates use a dedicated sync SQLAlchemy session to avoid asyncio in Celery workers.
    """
    return asyncio.get_event_loop().run_until_complete(
        _async_generate(self, job_id, report_id)
    )


async def _async_generate(task, job_id: str, report_id: str) -> dict:  # noqa: ANN001
    from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
    from backend.repositories.report_repo import get_job, update_job
    from backend.models.job import JobStatus
    from backend.services.pdf_generator import write_pdf

    settings = get_settings()
    engine = create_async_engine(settings.database_url, echo=False)
    SessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False)

    async with SessionLocal() as db:
        job = await get_job(db, job_id)
        if not job:
            return {"error": "Job not found"}

        await update_job(db, job_id, status=JobStatus.running, progress=0)
        await db.commit()

        try:
            out_path = settings.storage_dir / f"{job_id}.pdf"

            # Simulate multi-step progress updates
            for step in range(1, 11):
                progress = step * 10
                await update_job(db, job_id, progress=progress)
                await db.commit()

                import asyncio as _asyncio
                await _asyncio.sleep(0.5)   # simulates rendering work

            write_pdf(str(out_path), report_id)

            await update_job(
                db, job_id,
                status=JobStatus.ready,
                progress=100,
                file_path=str(out_path),
            )
            await db.commit()
            return {"job_id": job_id, "status": "ready"}

        except Exception as exc:  # noqa: BLE001
            await update_job(
                db, job_id,
                status=JobStatus.error,
                error=str(exc)[:500],
            )
            await db.commit()
            return {"job_id": job_id, "status": "error", "error": str(exc)}
        finally:
            await engine.dispose()
