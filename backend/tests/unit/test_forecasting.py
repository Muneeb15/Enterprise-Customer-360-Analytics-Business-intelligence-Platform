"""Unit tests for analytics/forecasting.py — no DB required."""
import pytest

from backend.analytics.forecasting import exponential_smoothing, forecast_next_periods


class TestExponentialSmoothing:
    def test_single_element(self):
        assert exponential_smoothing([100.0]) == [100.0]

    def test_empty(self):
        assert exponential_smoothing([]) == []

    def test_length_preserved(self):
        series = [1.0, 2.0, 3.0, 4.0, 5.0]
        assert len(exponential_smoothing(series)) == len(series)

    def test_smoothing_reduces_noise(self):
        series = [100.0, 200.0, 50.0, 180.0]
        smoothed = exponential_smoothing(series, alpha=0.5)
        # Smoothed values should not swing as wildly
        diffs_raw = [abs(series[i] - series[i - 1]) for i in range(1, len(series))]
        diffs_smoothed = [abs(smoothed[i] - smoothed[i - 1]) for i in range(1, len(smoothed))]
        assert max(diffs_smoothed) < max(diffs_raw)


class TestForecastNextPeriods:
    def test_returns_correct_length(self):
        assert len(forecast_next_periods([100, 200, 300], n=3)) == 3

    def test_empty_series_returns_zeros(self):
        assert forecast_next_periods([], n=2) == [0, 0]

    def test_upward_trend_forecasts_higher(self):
        # Exponential smoothing lags behind the series, so the forecast
        # will be lower than the last raw value but higher than the first.
        series = [100, 200, 300, 400, 500]
        forecast = forecast_next_periods(series, n=1)
        assert forecast[0] > series[0]   # higher than the start of the series
