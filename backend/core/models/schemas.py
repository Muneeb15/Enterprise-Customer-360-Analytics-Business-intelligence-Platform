from __future__ import annotations
from typing import Literal, Optional
from pydantic import BaseModel


class Kpi(BaseModel):
    label: str
    value: str
    delta: str
    tone: Literal["pos", "neg", "neutral"]
    hero: bool = False


class RevenuePoint(BaseModel):
    month: str
    revenue: int
    prior: int


class Segment(BaseModel):
    name: str
    share: int
    revenue: int
    count: int


class Region(BaseModel):
    name: str
    share: int
    revenue: int


class Customer(BaseModel):
    id: str
    name: str
    status: Literal["Active", "At Risk", "Churned"]
    segment: str
    region: str
    ltv: int
    mrr: int
    recency: str
    frequency: int
    monetary: int
    joined: str


class CustomerTransaction(BaseModel):
    id: str
    date: str
    description: str
    category: Literal["Billing", "Support", "Contract", "Product", "Expansion"]
    amount: int


class CategoryRevenue(BaseModel):
    name: str
    value: int


class HeatmapCell(BaseModel):
    month: str
    intensity: int


class HeatmapRow(BaseModel):
    week: str
    values: list[HeatmapCell]


class FunnelStage(BaseModel):
    stage: str
    value: int


class Campaign(BaseModel):
    id: str
    name: str
    channel: str
    spend: int
    revenue: int
    roas: float
    cac: int


class Report(BaseModel):
    id: str
    name: str
    type: str
    updated: str
    size: str
    author: str


class TeamMember(BaseModel):
    id: str
    name: str
    email: str
    role: str
    lastActive: str


class Job(BaseModel):
    job_id: str
    report_id: str
    status: Literal["queued", "running", "ready", "error"]
    progress: int  # 0–100
    pdf_url: Optional[str] = None
    error: Optional[str] = None


class GenerateResponse(BaseModel):
    job_id: str
    status: str
