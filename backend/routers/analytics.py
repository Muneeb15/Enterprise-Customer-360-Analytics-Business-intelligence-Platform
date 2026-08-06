from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.dependencies import get_db, get_current_user, CurrentUser
from backend.schemas.analytics import (
    AnomalyPoint, CorrelationPair, EDAReport, ForecastPoint,
)
from backend.services import analytics_service
from backend.utils.logging import get_logger

router = APIRouter(tags=["analytics"])
logger = get_logger("analytics_router")


@router.get("/analytics/forecast", response_model=list[ForecastPoint])
async def get_forecast(
    periods: int = Query(default=3, ge=1, le=12),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> list[ForecastPoint]:
    try:
        return await analytics_service.get_forecast(db, org_id=current_user.org_id, periods=periods)
    except Exception as exc:
        logger.warning("Forecast failed for org %s: %s", current_user.org_id, exc)
        raise HTTPException(status_code=500, detail=f"Forecast computation failed: {exc}")


@router.get("/analytics/anomalies", response_model=list[AnomalyPoint])
async def get_anomalies(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> list[AnomalyPoint]:
    try:
        return await analytics_service.get_anomalies(db, org_id=current_user.org_id)
    except Exception as exc:
        logger.warning("Anomaly detection failed for org %s: %s", current_user.org_id, exc)
        return []   # Return empty list rather than 500 — UI shows "no anomalies"


@router.get("/analytics/correlations", response_model=list[CorrelationPair])
async def get_correlations(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> list[CorrelationPair]:
    try:
        return await analytics_service.get_correlations(db, org_id=current_user.org_id)
    except Exception as exc:
        logger.warning("Correlation analysis failed for org %s: %s", current_user.org_id, exc)
        return []


@router.get("/analytics/eda", response_model=EDAReport)
async def get_eda(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> EDAReport:
    try:
        return await analytics_service.get_eda_report(db, org_id=current_user.org_id)
    except Exception as exc:
        logger.warning("EDA failed for org %s: %s", current_user.org_id, exc)
        raise HTTPException(status_code=500, detail=f"EDA computation failed: {exc}")
