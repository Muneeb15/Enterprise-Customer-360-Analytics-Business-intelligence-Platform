"""
Anomaly detection using z-score on a time series.
Pure functions — no DB/FastAPI imports.
"""
from __future__ import annotations
import math
from dataclasses import dataclass


@dataclass
class Anomaly:
    index: int
    value: float
    mean: float
    std: float
    z_score: float
    severity: str       # "warning" | "critical"
    direction: str      # "high" | "low"


def z_score_anomalies(
    series: list[float],
    threshold_warning: float = 2.0,
    threshold_critical: float = 3.0,
) -> list[Anomaly]:
    """
    Flag data points that deviate more than `threshold` standard deviations
    from the rolling mean of the series.
    Returns a list of Anomaly objects for each flagged point.
    """
    if len(series) < 3:
        return []

    mean = sum(series) / len(series)
    variance = sum((x - mean) ** 2 for x in series) / len(series)
    std = math.sqrt(variance) if variance > 0 else 0.0

    if std == 0:
        return []

    anomalies: list[Anomaly] = []
    for i, value in enumerate(series):
        z = abs((value - mean) / std)
        if z >= threshold_warning:
            severity = "critical" if z >= threshold_critical else "warning"
            direction = "high" if value > mean else "low"
            anomalies.append(Anomaly(
                index=i,
                value=value,
                mean=round(mean, 2),
                std=round(std, 2),
                z_score=round(z, 2),
                severity=severity,
                direction=direction,
            ))

    return anomalies


def detect_kpi_anomalies(monthly_revenues: list[int]) -> list[dict]:
    """
    Given 12 monthly revenue values, return any anomalous months
    formatted as API-friendly dicts.
    """
    floats = [float(v) for v in monthly_revenues]
    raw = z_score_anomalies(floats)
    return [
        {
            "month_index": a.index,
            "value": a.value,
            "expected": a.mean,
            "z_score": a.z_score,
            "severity": a.severity,
            "direction": a.direction,
        }
        for a in raw
    ]
