"""Unit tests for analytics/rfm.py — no DB required."""
from datetime import date, timedelta
import pytest

from backend.analytics.rfm import (
    score_recency,
    score_frequency,
    score_monetary,
    label_segment,
    compute_rfm,
    recency_label,
)


class TestScoreRecency:
    def test_same_day_is_5(self):
        assert score_recency(0) == 5

    def test_one_week_is_5(self):
        assert score_recency(7) == 5

    def test_8_days_is_4(self):
        assert score_recency(8) == 4

    def test_31_days_is_3(self):
        assert score_recency(31) == 3

    def test_91_days_is_2(self):
        assert score_recency(91) == 2

    def test_181_days_is_1(self):
        assert score_recency(181) == 1


class TestScoreFrequency:
    def test_100_txns_is_5(self):
        assert score_frequency(100) == 5

    def test_1_txn_is_1(self):
        assert score_frequency(1) == 1

    def test_50_txns_is_4(self):
        assert score_frequency(50) == 4


class TestScoreMonetary:
    def test_high_ltv_is_5(self):
        assert score_monetary(600_000) == 5

    def test_zero_ltv_is_1(self):
        assert score_monetary(0) == 1


class TestLabelSegment:
    def test_high_all_is_enterprise(self):
        assert label_segment(5, 5, 5) == "Enterprise Growth"

    def test_low_all_is_dormant(self):
        assert label_segment(1, 1, 1) == "Dormant"

    def test_low_recency_high_freq_is_churn(self):
        seg = label_segment(1, 2, 2)
        assert seg == "SMB High Churn"


class TestComputeRFM:
    def test_returns_all_fields(self):
        result = compute_rfm(date.today() - timedelta(days=3), 60, 300_000)
        assert result.recency_score == 5
        assert result.frequency_score == 4
        assert result.monetary_score == 4
        assert result.segment != ""
        assert result.recency_label != ""

    def test_none_last_activity(self):
        result = compute_rfm(None, 0, 0)
        assert result.recency_score == 1


class TestRecencyLabel:
    def test_today(self):
        assert recency_label(date.today()) == "Today"

    def test_none_is_never(self):
        assert recency_label(None) == "Never"

    def test_days(self):
        assert "d ago" in recency_label(date.today() - timedelta(days=3))
