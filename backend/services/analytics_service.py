"""
Data Science / Analytics service.
Orchestrates EDA, forecasting, anomaly detection, correlation, trend analysis.
"""
from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from backend.repositories import revenue_repo, customer_repo
from backend.analytics.forecasting import forecast_next_periods, exponential_smoothing
from backend.analytics.anomaly import detect_kpi_anomalies
from backend.analytics.statistics import (
    descriptive_stats,
    pearson_correlation,
    linear_trend,
    month_over_month_growth,
)
from backend.schemas.analytics import (
    AnomalyPoint,
    CorrelationPair,
    EDAReport,
    ForecastPoint,
    StatsSummary,
    TrendAnalysis,
)
from backend.data.seed import REVENUE_SERIES, CUSTOMERS as SEED_CUSTOMERS

MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]


async def get_forecast(db: AsyncSession, org_id: str, periods: int = 3) -> list[ForecastPoint]:
    """
    Return historical months + `periods` forecast months.
    Uses exponential smoothing. Confidence bands are ±10%.
    Historical points have forecast=None to avoid misleading chart overlap.
    """
    from datetime import date, timedelta
    import calendar

    snapshots = await revenue_repo.get_monthly_series(db, org_id)
    if snapshots and len(snapshots) >= 2:
        historical = [s.gross_revenue for s in snapshots]
        labels = [s.month_label for s in snapshots]
    else:
        # Use seed only if DB is genuinely empty — never mix
        historical = [s.revenue for s in REVENUE_SERIES]
        labels = [s.month for s in REVENUE_SERIES]

    if len(historical) < 2:
        return [ForecastPoint(month="—", actual=None, forecast=0, lower=0, upper=0)]

    forecasted = forecast_next_periods(historical, n=periods)

    result: list[ForecastPoint] = []
    # Historical: actual shown, forecast=None (don't draw a dashed line over history)
    for label, val in zip(labels, historical):
        result.append(ForecastPoint(
            month=label, actual=val, forecast=None, lower=None, upper=None
        ))

    # Generate real future month labels from last historical month
    try:
        last_month_str = labels[-1]  # e.g. "Dec" or "2024-12"
        month_abbrs = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
        if last_month_str in month_abbrs:
            last_idx = month_abbrs.index(last_month_str)
        else:
            last_idx = (date.today().month - 1) % 12
        next_labels = [month_abbrs[(last_idx + i + 1) % 12] for i in range(periods)]
    except Exception:
        next_labels = [f"M+{i+1}" for i in range(periods)]

    for i, fval in enumerate(forecasted):
        band = max(int(fval * 0.10), 1)
        result.append(ForecastPoint(
            month=next_labels[i],
            actual=None,
            forecast=fval,
            lower=max(0, fval - band),
            upper=fval + band,
        ))

    return result


async def get_anomalies(db: AsyncSession, org_id: str) -> list[AnomalyPoint]:
    snapshots = await revenue_repo.get_monthly_series(db, org_id)
    revenues = [s.gross_revenue for s in snapshots] if snapshots else [s.revenue for s in REVENUE_SERIES]
    raw = detect_kpi_anomalies(revenues)
    return [AnomalyPoint(**a) for a in raw]


async def get_correlations(db: AsyncSession, org_id: str) -> list[CorrelationPair]:
    """Compute correlations between key business metrics."""
    snapshots = await revenue_repo.get_monthly_series(db, org_id)
    if snapshots and len(snapshots) >= 3:
        rev = [s.gross_revenue for s in snapshots]
        prior = [s.prior_revenue for s in snapshots]   # real DB field
    else:
        # Seed fallback — use .revenue and .prior (correct field names on RevenuePoint schema)
        rev = [s.revenue for s in REVENUE_SERIES]
        prior = [s.prior for s in REVENUE_SERIES]      # RevenuePoint has .prior, not .prior_revenue

    # Simple indices as proxy for time / customer activity
    idx = list(range(len(rev)))
    pairs = [
        ("Revenue", "Prior Year", pearson_correlation(rev, prior)),
        ("Revenue", "Time", pearson_correlation(rev, [float(i) for i in idx])),
        ("Prior Year", "Time", pearson_correlation(prior, [float(i) for i in idx])),
    ]

    def strength(c: float) -> str:
        a = abs(c)
        if a >= 0.7: return "strong"
        if a >= 0.4: return "moderate"
        if a >= 0.2: return "weak"
        return "none"

    return [
        CorrelationPair(metric_a=a, metric_b=b, coefficient=c, strength=strength(c))
        for a, b, c in pairs
    ]


async def get_eda_report(db: AsyncSession, org_id: str) -> EDAReport:
    """Full EDA report combining stats, correlation, anomalies, and trend."""
    snapshots = await revenue_repo.get_monthly_series(db, org_id)
    rev_list = [float(s.gross_revenue) for s in snapshots] if snapshots else [float(s.revenue) for s in REVENUE_SERIES]

    customers = await customer_repo.get_all(db, org_id=org_id)
    mrr_list = [float(c.mrr) for c in customers] if customers else [float(c.mrr) for c in SEED_CUSTOMERS]
    ltv_list = [float(c.ltv) for c in customers] if customers else [float(c.ltv) for c in SEED_CUSTOMERS]

    rev_stats = descriptive_stats(rev_list)
    mrr_stats = descriptive_stats(mrr_list)
    ltv_stats = descriptive_stats(ltv_list)

    trend_data = linear_trend(rev_list)
    direction = "up" if trend_data["slope"] > 0 else ("down" if trend_data["slope"] < 0 else "flat")
    growth_rates = month_over_month_growth(rev_list)

    def _to_schema(name: str, s) -> StatsSummary:
        return StatsSummary(
            metric=name, count=s.count, mean=s.mean, median=s.median,
            std=s.std, min=s.min, max=s.max, q1=s.q1, q3=s.q3,
        )

    return EDAReport(
        stats=[
            _to_schema("Monthly Revenue", rev_stats),
            _to_schema("Customer MRR", mrr_stats),
            _to_schema("Customer LTV", ltv_stats),
        ],
        correlations=await get_correlations(db, org_id),
        anomalies=await get_anomalies(db, org_id),
        trend=TrendAnalysis(
            metric="Monthly Revenue",
            slope=trend_data["slope"],
            direction=direction,
            r_squared=trend_data["r_squared"],
            growth_rates=growth_rates,
        ),
    )
