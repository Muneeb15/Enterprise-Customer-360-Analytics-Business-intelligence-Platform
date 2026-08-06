"""Integration tests — KPI, revenue, marketing, sales endpoints."""
import pytest


@pytest.mark.asyncio
async def test_kpis(client):
    resp = await client.get("/api/kpis")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) == 4
    labels = [k["label"] for k in data]
    assert "Total Revenue" in labels
    assert "Active Customers" in labels


@pytest.mark.asyncio
async def test_revenue_series(client):
    resp = await client.get("/api/revenue-series")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) == 12
    assert all({"month", "revenue", "prior"} <= set(r.keys()) for r in data)


@pytest.mark.asyncio
async def test_category_revenue(client):
    resp = await client.get("/api/category-revenue")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert all("name" in r and "value" in r for r in data)


@pytest.mark.asyncio
async def test_seasonal_heatmap(client):
    resp = await client.get("/api/seasonal-heatmap")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) == 4  # W1–W4
    assert all("week" in r and "values" in r for r in data)


@pytest.mark.asyncio
async def test_regions(client):
    resp = await client.get("/api/regions")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert all({"name", "share", "revenue"} <= set(r.keys()) for r in data)


@pytest.mark.asyncio
async def test_funnel(client):
    resp = await client.get("/api/funnel")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert all("stage" in r and "value" in r for r in data)


@pytest.mark.asyncio
async def test_campaigns(client):
    resp = await client.get("/api/campaigns")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert all({"id", "name", "channel", "spend", "revenue", "roas", "cac"} <= set(c.keys()) for c in data)


@pytest.mark.asyncio
async def test_campaigns_filter_by_channel(client):
    resp = await client.get("/api/campaigns?channel=Sales")
    assert resp.status_code == 200
    data = resp.json()
    assert all(c["channel"] == "Sales" for c in data)


@pytest.mark.asyncio
async def test_team_members(client):
    resp = await client.get("/api/team-members")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert all({"id", "name", "email", "role"} <= set(m.keys()) for m in data)
