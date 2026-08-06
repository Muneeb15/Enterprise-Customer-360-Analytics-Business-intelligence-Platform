from __future__ import annotations
from typing import Literal
from pydantic import BaseModel


class ForecastPoint(BaseModel):
    month: str
    actual: int | None       # None for future periods
    forecast: int | None     # None for historical periods (avoids misleading dashed line)
    lower: int | None        # None for historical periods
    upper: int | None        # None for historical periods


class AnomalyPoint(BaseModel):
    month_index: int
    value: float
    expected: float
    z_score: float
    severity: Literal["warning", "critical"]
    direction: Literal["high", "low"]


class CorrelationPair(BaseModel):
    metric_a: str
    metric_b: str
    coefficient: float   # -1.0 to 1.0
    strength: str        # "strong" | "moderate" | "weak" | "none"


class StatsSummary(BaseModel):
    metric: str
    count: int
    mean: float
    median: float
    std: float
    min: float
    max: float
    q1: float
    q3: float


class TrendAnalysis(BaseModel):
    metric: str
    slope: float
    direction: str        # "up" | "down" | "flat"
    r_squared: float
    growth_rates: list[float]   # MoM growth %


class EDAReport(BaseModel):
    stats: list[StatsSummary]
    correlations: list[CorrelationPair]
    anomalies: list[AnomalyPoint]
    trend: TrendAnalysis
