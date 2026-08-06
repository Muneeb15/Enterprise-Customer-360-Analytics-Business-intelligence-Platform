from __future__ import annotations
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.dependencies import get_db, get_current_user, CurrentUser
from backend.schemas.report import Report, GenerateResponse
from backend.schemas.pagination import PaginatedResponse
from backend.services import report_service, job_service
from backend.utils.fallback import with_seed_fallback
from backend.utils.logging import get_logger
from backend.data.seed import REPORTS as SEED_REPORTS

router = APIRouter(tags=["reports"])
logger = get_logger("reports_router")


@router.get("/reports", response_model=PaginatedResponse[Report])
async def list_reports(
    type: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> PaginatedResponse[Report]:
    seed = [r for r in SEED_REPORTS if not type or r.type == type]
    all_items: list[Report] = await with_seed_fallback(
        lambda: report_service.list_reports(db, org_id=current_user.org_id, type_filter=type),
        seed,
    )
    total = len(all_items)
    start = (page - 1) * page_size
    return PaginatedResponse.build(all_items[start : start + page_size], total, page, page_size)


@router.get("/reports/{report_id}", response_model=Report)
async def get_report(
    report_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> Report:
    report = await with_seed_fallback(
        lambda: report_service.get_report(db, org_id=current_user.org_id, report_id=report_id),
        next((r for r in SEED_REPORTS if r.id == report_id), None),
    )
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.post("/reports/{report_id}/generate", response_model=GenerateResponse)
async def start_generation(
    report_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> GenerateResponse:
    job_id = f"job_{report_id}_{uuid.uuid4().hex[:8]}"

    # Check report exists (DB first, then seed fallback)
    report = await with_seed_fallback(
        lambda: report_service.get_report(db, org_id=current_user.org_id, report_id=report_id),
        next((r for r in SEED_REPORTS if r.id == report_id), None),
    )
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")

    # Production path: Celery + DB-persisted job
    try:
        from backend.workers.tasks import generate_report_task
        await report_service.enqueue_generation(
            db, org_id=current_user.org_id, report_id=report_id, job_id=job_id
        )
        generate_report_task.delay(job_id, report_id)
        return GenerateResponse(job_id=job_id, status="queued")
    except Exception as exc:
        logger.warning("Celery/DB enqueue failed for job %s, falling back to dev mode: %s", job_id, exc)

    # Dev fallback: in-process BackgroundTask (no Celery required)
    return job_service.start_background_generation(job_id, report_id, background_tasks)
