"""
Seasonal heatmap intensity calculation.
Pure function — no DB/FastAPI imports.
"""
from __future__ import annotations
import math


def compute_heatmap(
    revenue_by_week_month: dict[tuple[str, str], int],
    weeks: list[str] | None = None,
    months: list[str] | None = None,
) -> list[dict]:
    """
    Given a dict of {(week, month): revenue}, compute normalized intensity 0–100.

    Falls back to the deterministic sine-based formula from seed.py when the
    dict is empty (useful for demo / before real data is available).
    """
    _weeks = weeks or ["W1", "W2", "W3", "W4"]
    _months = months or ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                         "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    if not revenue_by_week_month:
        return _seed_heatmap(_weeks, _months)

    max_rev = max(revenue_by_week_month.values(), default=1)
    rows = []
    for wi, w in enumerate(_weeks):
        values = []
        for m in _months:
            rev = revenue_by_week_month.get((w, m), 0)
            intensity = round((rev / max_rev) * 100) if max_rev else 0
            values.append({"month": m, "intensity": intensity})
        rows.append({"week": w, "values": values})
    return rows


def _seed_heatmap(weeks: list[str], months: list[str]) -> list[dict]:
    def rng(i: int) -> float:
        return abs(math.sin(i * 12.9898)) % 1

    rows = []
    for wi, w in enumerate(weeks):
        values = [
            {"month": m, "intensity": round(rng(wi * 12 + mi) * 100)}
            for mi, m in enumerate(months)
        ]
        rows.append({"week": w, "values": values})
    return rows
