"""Unit tests for analytics/anomaly.py — no DB required."""
import pytest
from backend.analytics.anomaly import z_score_anomalies, detect_kpi_anomalies


class TestZScoreAnomalies:
    def test_no_anomaly_flat(self):
        series = [100.0] * 12
        assert z_score_anomalies(series) == []

    def test_detects_spike(self):
        series = [100.0] * 10 + [500.0, 100.0]  # one big spike
        anomalies = z_score_anomalies(series, threshold_warning=1.5)
        assert any(a.index == 10 for a in anomalies)

    def test_direction_high(self):
        series = [100.0] * 10 + [500.0, 100.0]
        anomalies = z_score_anomalies(series, threshold_warning=1.5)
        spike = next(a for a in anomalies if a.index == 10)
        assert spike.direction == "high"

    def test_direction_low(self):
        series = [100.0] * 10 + [1.0, 100.0]
        anomalies = z_score_anomalies(series, threshold_warning=1.5)
        dip = next((a for a in anomalies if a.index == 10), None)
        if dip:
            assert dip.direction == "low"

    def test_too_short(self):
        assert z_score_anomalies([100.0, 200.0]) == []

    def test_severity_critical(self):
        base = [100.0] * 10
        extreme = [100.0] * 10 + [10_000.0, 100.0]
        anomalies = z_score_anomalies(extreme, threshold_warning=2.0, threshold_critical=3.0)
        critical = [a for a in anomalies if a.severity == "critical"]
        assert len(critical) > 0


class TestDetectKpiAnomalies:
    def test_returns_dicts(self):
        revenues = [820_000, 910_000, 1_120_000, 1_050_000, 1_240_000, 1_180_000,
                    1_340_000, 1_290_000, 1_420_000, 1_380_000, 1_510_000, 1_622_000]
        result = detect_kpi_anomalies(revenues)
        assert isinstance(result, list)
        for item in result:
            assert "month_index" in item
            assert "severity" in item
            assert "z_score" in item
