from pydantic import BaseModel


class Store(BaseModel):
    id: str
    name: str
    code: str
    country: str
    region: str
    city: str
    manager: str
    staff_count: int
    annual_target: int
    annual_revenue: int
    customer_count: int
    nps_score: float
    status: str
    attainment_pct: float   # revenue / target * 100


class BranchPerformanceSummary(BaseModel):
    total_stores: int
    total_revenue: int
    avg_attainment: float
    top_store: str
    countries: int
