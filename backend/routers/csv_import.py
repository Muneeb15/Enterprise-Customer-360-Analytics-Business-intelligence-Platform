from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.dependencies import get_db, get_current_user, CurrentUser
from backend.schemas.csv_import import (
    CsvPreviewResponse,
    ImportRequest,
    ImportResult,
    CUSTOMER_FIELDS,
)
from backend.services.csv_import_service import (
    import_customers,
    preview_csv,
    validate_and_decode,
    CsvValidationError,
)
from backend.models.import_log import ImportLog

router = APIRouter(prefix="/import", tags=["import"])


@router.get("/fields", response_model=list[dict])
async def get_importable_fields() -> list[dict]:
    """Return the list of target fields available for column mapping."""
    return CUSTOMER_FIELDS


@router.get("/history", response_model=list[dict])
async def get_import_history(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> list[dict]:
    """Return all past CSV import attempts for this org, newest first."""
    try:
        result = await db.execute(
            select(ImportLog)
            .where(ImportLog.org_id == current_user.org_id)
            .order_by(ImportLog.created_at.desc())
            .limit(50)
        )
        logs = result.scalars().all()
        return [
            {
                "id": log.id,
                "filename": log.filename,
                "rows_imported": log.rows_imported,
                "rows_skipped": log.rows_skipped,
                "rows_error": log.rows_error,
                "status": log.status,
                "imported_by": log.imported_by,
                "created_at": log.created_at.isoformat() if log.created_at else None,
            }
            for log in logs
        ]
    except Exception:
        return []  # graceful fallback if table doesn't exist yet


@router.post("/preview", response_model=CsvPreviewResponse)
async def upload_preview(
    file: UploadFile = File(...),
    current_user: CurrentUser = Depends(get_current_user),
) -> CsvPreviewResponse:
    """Step 1 — Upload CSV, get headers + 10-row preview + file_id."""
    raw = await file.read()
    try:
        content = validate_and_decode(file.filename, raw)
    except CsvValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return preview_csv(content, org_id=current_user.org_id)


@router.post("/customers", response_model=ImportResult)
async def import_customers_endpoint(
    request: ImportRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> ImportResult:
    """Step 2 — Run import with user's column mappings. Atomic — full rollback on error."""
    result = await import_customers(db, request, org_id=current_user.org_id)

    # Log the import attempt (best-effort — don't fail the response if logging fails)
    try:
        status = "success" if result.imported > 0 and not result.rollback else (
            "error" if result.rollback else "partial"
        )
        log = ImportLog(
            org_id=current_user.org_id,
            filename=request.filename if hasattr(request, "filename") else "unknown.csv",
            rows_imported=result.imported,
            rows_skipped=result.skipped,
            rows_error=len(result.errors),
            status=status,
            imported_by=current_user.email or current_user.clerk_user_id,
        )
        db.add(log)
        await db.commit()
    except Exception:
        pass

    return result
