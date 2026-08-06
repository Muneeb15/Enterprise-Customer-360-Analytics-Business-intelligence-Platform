"""Unit tests for analytics/statistics.py — no DB required."""
import pytest
from backend.analytics.statistics import (
    descriptive_stats, pearson_correlation, linear_trend, month_over_month_growth,
)


class TestDescriptiveStats:
    def test_basic(self):
        s = descriptive_stats([1.0, 2.0, 3.0, 4.0, 5.0])
        assert s.count == 5
        assert s.mean == 3.0
        assert s.min == 1.0
        assert s.max == 5.0

    def test_empty(self):
        s = descriptive_stats([])
        assert s.count == 0
        assert s.mean == 0

    def test_single(self):
        s = descriptive_stats([42.0])
        assert s.count == 1
        assert s.mean == 42.0
        assert s.std == 0.0


class TestPearsonCorrelation:
    def test_perfect_positive(self):
        x = [1.0, 2.0, 3.0, 4.0, 5.0]
        assert pearson_correlation(x, x) == 1.0

    def test_perfect_negative(self):
        x = [1.0, 2.0, 3.0, 4.0, 5.0]
        y = [5.0, 4.0, 3.0, 2.0, 1.0]
        assert pearson_correlation(x, y) == -1.0

    def test_no_correlation(self):
        r = pearson_correlation([1.0, 2.0], [3.0, 3.0])
        assert r == 0.0

    def test_too_short(self):
        assert pearson_correlation([1.0], [2.0]) == 0.0


class TestLinearTrend:
    def test_upward(self):
        series = [1.0, 2.0, 3.0, 4.0, 5.0]
        result = linear_trend(series)
        assert result["slope"] > 0
        assert result["r_squared"] == 1.0

    def test_flat(self):
        series = [3.0, 3.0, 3.0, 3.0]
        result = linear_trend(series)
        assert result["slope"] == 0.0

    def test_too_short(self):
        result = linear_trend([5.0])
        assert result["r_squared"] == 0.0


class TestMoMGrowth:
    def test_basic(self):
        rates = month_over_month_growth([100.0, 110.0, 121.0])
        assert rates[0] == 0.0
        assert abs(rates[1] - 10.0) < 0.01
        assert abs(rates[2] - 10.0) < 0.01

    def test_zero_prev(self):
        rates = month_over_month_growth([0.0, 100.0])
        assert rates[1] == 0.0
