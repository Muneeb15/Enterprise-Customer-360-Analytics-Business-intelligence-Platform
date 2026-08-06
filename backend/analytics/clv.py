"""
Customer Lifetime Value estimation.
Pure function — no DB/FastAPI imports.
"""
from __future__ import annotations


def estimate_clv(
    mrr: int,
    churn_probability: float,  # 0.0–1.0
    avg_months: float = 24.0,
) -> int:
    """
    Simple predictive CLV:  MRR × (1 / churn_rate) capped at avg_months.
    Falls back gracefully when churn_probability is 0.
    """
    if churn_probability <= 0:
        return mrr * int(avg_months)
    expected_months = min(1 / churn_probability, avg_months)
    return int(mrr * expected_months)


def historical_clv(total_revenue: int) -> int:
    """Already-realised LTV — just pass through the stored value."""
    return total_revenue
