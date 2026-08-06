from pydantic import BaseModel


class Product(BaseModel):
    id: str
    name: str
    sku: str
    category: str
    price: int
    units_sold: int
    revenue: int
    growth_pct: float
    return_rate: float
    status: str


class ProductPerformanceSummary(BaseModel):
    total_products: int
    total_revenue: int
    top_category: str
    avg_growth_pct: float


class CategoryBreakdown(BaseModel):
    category: str
    revenue: int
    units_sold: int
    share_pct: float
    growth_pct: float
