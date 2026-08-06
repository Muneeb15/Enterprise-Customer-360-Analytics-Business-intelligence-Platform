"""
Churn / at-risk classification logic.
Pure function — no DB/FastAPI imports.
"""
from __future__ import annotations
from datetime import date
from typing import Literal

CustomerStatus = Literal["Active", "At Risk", "Churned"]


def classify_status(
    last_activity: date | None,
    mrr: int,
    days_at_risk_threshold: int = 14,
    days_churned_threshold: int = 60,
) -> CustomerStatus:
    """
    Classify a customer as Active / At Risk / Churned based on recency and MRR.
    """
    if mrr == 0:
        return "Churned"
    if last_activity is None:
        return "At Risk"
    days = (date.today() - last_activity).days
    if days >= days_churned_threshold:
        return "Churned"
    if days >= days_at_risk_threshold:
        return "At Risk"
    return "Active"


def churn_probability(days_inactive: int) -> float:
    """
    Rough sigmoid-based churn probability from days inactive.
    Returns a value between 0.0 and 1.0.
    """
    import math
    k = 0.05
    midpoint = 45
    return round(1 / (1 + math.exp(-k * (days_inactive - midpoint))), 4)
