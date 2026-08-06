"""Integration tests — /api/customers endpoints (uses seed fallback)."""
import pytest


@pytest.mark.asyncio
async def test_list_customers(client):
    resp = await client.get("/api/customers")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data
    assert isinstance(data["items"], list)
    assert len(data["items"]) > 0
    first = data["items"][0]
    assert "id" in first
    assert "name" in first
    assert "status" in first
    assert first["status"] in ("Active", "At Risk", "Churned")


@pytest.mark.asyncio
async def test_get_customer(client):
    resp = await client.get("/api/customers/cus_vertex")
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == "cus_vertex"
    assert data["name"] == "Vertex Systems"


@pytest.mark.asyncio
async def test_get_customer_not_found(client):
    resp = await client.get("/api/customers/does_not_exist")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_filter_by_segment(client):
    resp = await client.get("/api/customers?segment=Enterprise Growth")
    assert resp.status_code == 200
    data = resp.json()
    assert all(c["segment"] == "Enterprise Growth" for c in data["items"])


@pytest.mark.asyncio
async def test_filter_by_status(client):
    resp = await client.get("/api/customers?status=Active")
    assert resp.status_code == 200
    data = resp.json()
    assert all(c["status"] == "Active" for c in data["items"])


@pytest.mark.asyncio
async def test_get_transactions(client):
    resp = await client.get("/api/customers/cus_vertex/transactions")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) > 0
    first = data[0]
    assert "id" in first
    assert "amount" in first
    assert "category" in first
