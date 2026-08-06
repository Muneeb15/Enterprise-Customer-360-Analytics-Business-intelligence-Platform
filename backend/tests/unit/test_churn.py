"""Unit tests for analytics/churn.py — no DB required."""
from datetime import date, timedelta
import pytest

from backend.analytics.churn import classify_status, churn_probability


class TestClassifyStatus:
    def test_active(self):
        assert classify_status(date.today(), mrr=1000) == "Active"

    def test_at_risk_after_threshold(self):
        last = date.today() - timedelta(days=20)
        assert classify_status(last, mrr=1000) == "At Risk"

    def test_churned_after_60_days(self):
        last = date.today() - timedelta(days=61)
        assert classify_status(last, mrr=1000) == "Churned"

    def test_zero_mrr_is_churned(self):
        assert classify_status(date.today(), mrr=0) == "Churned"

    def test_none_last_activity_is_at_risk(self):
        assert classify_status(None, mrr=500) == "At Risk"


class TestChurnProbability:
    def test_long_inactive_is_near_1(self):
        prob = churn_probability(180)
        assert prob > 0.9

    def test_recent_is_near_0(self):
        prob = churn_probability(0)
        assert prob < 0.15

    def test_midpoint(self):
        prob = churn_probability(45)
        assert 0.45 < prob < 0.55
