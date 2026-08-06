"""
Simple revenue forecasting.
Pure function — no DB/FastAPI imports.

Uses exponential smoothing (no heavy dependencies like Prophet).
Swap out forecast_next_periods() for Prophet/Statsmodels when ready.
"""
from __future__ import annotations


def exponential_smoothing(series: list[float], alpha: float = 0.3) -> list[float]:
    """
    Single exponential smoothing.
    Returns a smoothed series of the same length.
    """
    if not series:
        return []
    smoothed = [series[0]]
    for x in series[1:]:
        smoothed.append(alpha * x + (1 - alpha) * smoothed[-1])
    return smoothed


def forecast_next_periods(
    series: list[int],
    n: int = 3,
    alpha: float = 0.3,
) -> list[int]:
    """
    Forecast the next n periods using exponential smoothing on the input series.
    Returns a list of n integer forecasted values.
    """
    if not series:
        return [0] * n
    smoothed = exponential_smoothing([float(v) for v in series], alpha)
    last = smoothed[-1]
    # Simple drift: last smoothed value + average period-on-period change
    if len(smoothed) >= 2:
        drift = (smoothed[-1] - smoothed[0]) / (len(smoothed) - 1)
    else:
        drift = 0.0
    return [int(last + drift * (i + 1)) for i in range(n)]
