"""Integration tests — /api/reports and /api/jobs endpoints."""
import pytest


@pytest.mark.asyncio
async def test_list_reports(client):
    resp = await client.get("/api/reports")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data
    assert isinstance(data["items"], list)
    assert len(data["items"]) > 0
    first = data["items"][0]
    assert "id" in first
    assert "name" in first
    assert "type" in first


@pytest.mark.asyncio
async def test_get_report(client):
    resp = await client.get("/api/reports/rep_q4_2024")
    assert resp.status_code == 200
    assert resp.json()["id"] == "rep_q4_2024"


@pytest.mark.asyncio
async def test_get_report_not_found(client):
    resp = await client.get("/api/reports/no_such_report")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_filter_reports_by_type(client):
    resp = await client.get("/api/reports?type=Executive")
    assert resp.status_code == 200
    data = resp.json()
    assert all(r["type"] == "Executive" for r in data["items"])


@pytest.mark.asyncio
async def test_generate_report(client):
    # First create a report via the list endpoint to get a real ID
    list_resp = await client.get("/api/reports")
    assert list_resp.status_code == 200
    reports = list_resp.json().get("items", [])

    if not reports:
        pytest.skip("No reports in test DB — seed required")

    report_id = reports[0]["id"]
    resp = await client.post(f"/api/reports/{report_id}/generate")
    assert resp.status_code == 200
    data = resp.json()
    assert "job_id" in data
    assert data["status"] == "queued"


@pytest.mark.asyncio
async def test_get_job_after_generate(client):
    list_resp = await client.get("/api/reports")
    reports = list_resp.json().get("items", [])

    if not reports:
        pytest.skip("No reports in test DB — seed required")

    report_id = reports[0]["id"]
    gen = await client.post(f"/api/reports/{report_id}/generate")
    job_id = gen.json()["job_id"]

    resp = await client.get(f"/api/jobs/{job_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["job_id"] == job_id
    assert data["status"] in ("queued", "running", "ready", "error")


@pytest.mark.asyncio
async def test_get_job_not_found(client):
    resp = await client.get("/api/jobs/nonexistent_job")
    assert resp.status_code == 404
