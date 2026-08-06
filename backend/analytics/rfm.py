"""
Recency / Frequency / Monetary scoring.

Pure functions — no database or FastAPI imports.
Input: raw customer metrics.  Output: RFM scores (1–5) and segment label.
"""
from __future__ import annotations
from datetime import date
from dataclasses import dataclass


@dataclass
class RFMResult:
    recency_score: int      # 1 (worst) – 5 (best)
    frequency_score: int
    monetary_score: int
    segment: str
    recency_label: str      # human-readable, e.g. "2h ago"


def score_recency(days_since_last_activity: int) -> int:
    """Higher score = more recent."""
    if days_since_last_activity <= 7:
        return 5
    if days_since_last_activity <= 30:
        return 4
    if days_since_last_activity <= 90:
        return 3
    if days_since_last_activity <= 180:
        return 2
    return 1


def score_frequency(transaction_count: int) -> int:
    if transaction_count >= 100:
        return 5
    if transaction_count >= 50:
        return 4
    if transaction_count >= 20:
        return 3
    if transaction_count >= 5:
        return 2
    return 1


def score_monetary(ltv: int) -> int:
    if ltv >= 500_000:
        return 5
    if ltv >= 200_000:
        return 4
    if ltv >= 50_000:
        return 3
    if ltv >= 10_000:
        return 2
    return 1


def label_segment(r: int, f: int, m: int) -> str:
    avg = (r + f + m) / 3
    if avg <= 1.5:
        return "Dormant"
    if r >= 4 and avg >= 4:
        return "Enterprise Growth"
    if avg >= 3.5:
        return "Mid-Market Stable"
    if r <= 2 and avg < 3:
        return "SMB High Churn"
    if r >= 4 and f <= 2:
        return "New / Onboarding"
    return "Mid-Market Stable"


def recency_label(last_activity: date | None) -> str:
    if last_activity is None:
        return "Never"
    days = (date.today() - last_activity).days
    if days == 0:
        return "Today"
    if days == 1:
        return "1d ago"
    if days < 7:
        return f"{days}d ago"
    if days < 30:
        return f"{days // 7}w ago"
    return f"{days // 30}mo ago"


def compute_rfm(
    last_activity: date | None,
    transaction_count: int,
    ltv: int,
) -> RFMResult:
    days = (date.today() - last_activity).days if last_activity else 999
    r = score_recency(days)
    f = score_frequency(transaction_count)
    m = score_monetary(ltv)
    return RFMResult(
        recency_score=r,
        frequency_score=f,
        monetary_score=m,
        segment=label_segment(r, f, m),
        recency_label=recency_label(last_activity),
    )
