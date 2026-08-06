from typing import Literal
from pydantic import BaseModel


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


class Segment(BaseModel):
    name: str
    share: int
    revenue: int
    count: int
