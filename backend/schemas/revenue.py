from pydantic import BaseModel


class RevenuePoint(BaseModel):
    month: str
    revenue: int
    prior: int


class CategoryRevenue(BaseModel):
    name: str
    value: int


class HeatmapCell(BaseModel):
    month: str
    intensity: int


class HeatmapRow(BaseModel):
    week: str
    values: list[HeatmapCell]


class Region(BaseModel):
    name: str
    share: int
    revenue: int
