from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from backend.dependencies import get_db, get_current_user, CurrentUser
from backend.schemas.job import Job
from backend.services import job_service
from backend.core.exceptions import NotFoundError, ConflictError

router = APIRouter(tags=["jobs"])


@router.get("/jobs/{job_id}", response_model=Job)
async def get_job(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    _: CurrentUser = Depends(get_current_user),
) -> Job:
    # Production: Postgres
    try:
        return await job_service.get_job(db, job_id)
    except NotFoundError:
        pass
    except Exception:
        pass

    # Dev fallback: in-memory store
    job = await job_service.get_job_from_store(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("/jobs/{job_id}/download")
async def download_job(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    _: CurrentUser = Depends(get_current_user),
) -> FileResponse:
    # Production: Postgres
    try:
        file_path = await job_service.assert_job_ready(db, job_id)
        return FileResponse(path=file_path, media_type="application/pdf", filename=f"{job_id}.pdf")
    except NotFoundError:
        pass
    except ConflictError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except Exception:
        pass

    # Dev fallback: in-memory store
    from backend.routers._job_store import JOBS
    legacy = JOBS.get(job_id)
    if not legacy:
        raise HTTPException(status_code=404, detail="Job not found")
    if legacy.status != "ready" or not legacy.pdf_url:
        raise HTTPException(status_code=409, detail="PDF not ready yet")
    return FileResponse(path=legacy.pdf_url, media_type="application/pdf", filename=f"{legacy.report_id}.pdf")
