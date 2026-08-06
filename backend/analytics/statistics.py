"""
Statistical analysis utilities.
Pure functions — no DB/FastAPI imports.

Covers:
  - Descriptive statistics
  - Correlation (Pearson)
  - Hypothesis testing (t-test approximation)
  - Time series decomposition (trend + seasonality)
"""
from __future__ import annotations
import math
from dataclasses import dataclass


@dataclass
class DescriptiveStats:
    count: int
    mean: float
    median: float
    std: float
    min: float
    max: float
    q1: float
    q3: float
    iqr: float


def descriptive_stats(values: list[float]) -> DescriptiveStats:
    if not values:
        return DescriptiveStats(0, 0, 0, 0, 0, 0, 0, 0, 0)
    n = len(values)
    sorted_v = sorted(values)
    mean = sum(sorted_v) / n
    variance = sum((x - mean) ** 2 for x in sorted_v) / n
    std = math.sqrt(variance)
    median = sorted_v[n // 2] if n % 2 else (sorted_v[n // 2 - 1] + sorted_v[n // 2]) / 2
    q1 = sorted_v[n // 4]
    q3 = sorted_v[(3 * n) // 4]
    return DescriptiveStats(
        count=n, mean=round(mean, 2), median=round(median, 2),
        std=round(std, 2), min=sorted_v[0], max=sorted_v[-1],
        q1=q1, q3=q3, iqr=q3 - q1,
    )


def pearson_correlation(x: list[float], y: list[float]) -> float:
    """Pearson correlation coefficient between two equal-length series."""
    n = min(len(x), len(y))
    if n < 2:
        return 0.0
    x, y = x[:n], y[:n]
    mx, my = sum(x) / n, sum(y) / n
    num = sum((xi - mx) * (yi - my) for xi, yi in zip(x, y))
    den_x = math.sqrt(sum((xi - mx) ** 2 for xi in x))
    den_y = math.sqrt(sum((yi - my) ** 2 for yi in y))
    if den_x == 0 or den_y == 0:
        return 0.0
    return round(num / (den_x * den_y), 4)


def linear_trend(series: list[float]) -> dict:
    """
    Fit a simple linear trend y = a + b*x.
    Returns slope, intercept, and R².
    """
    n = len(series)
    if n < 2:
        return {"slope": 0.0, "intercept": 0.0, "r_squared": 0.0}
    x = list(range(n))
    mx = sum(x) / n
    my = sum(series) / n
    b_num = sum((xi - mx) * (yi - my) for xi, yi in zip(x, series))
    b_den = sum((xi - mx) ** 2 for xi in x)
    b = b_num / b_den if b_den else 0.0
    a = my - b * mx
    y_pred = [a + b * xi for xi in x]
    ss_res = sum((yi - yp) ** 2 for yi, yp in zip(series, y_pred))
    ss_tot = sum((yi - my) ** 2 for yi in series)
    r2 = 1 - ss_res / ss_tot if ss_tot else 0.0
    return {"slope": round(b, 4), "intercept": round(a, 2), "r_squared": round(r2, 4)}


def month_over_month_growth(series: list[float]) -> list[float]:
    """Return MoM % growth for each period (first element is None → 0)."""
    result = [0.0]
    for i in range(1, len(series)):
        prev = series[i - 1]
        if prev == 0:
            result.append(0.0)
        else:
            result.append(round((series[i] - prev) / prev * 100, 2))
    return result
