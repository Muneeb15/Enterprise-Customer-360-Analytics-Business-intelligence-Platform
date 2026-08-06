from __future__ import annotations
from typing import Literal, Optional
from pydantic import BaseModel, EmailStr, field_validator
import re


class CustomerCreate(BaseModel):
    name: str
    email: Optional[str] = None
    mrr: int = 0
    ltv: int = 0
    segment: str = "New / Onboarding"
    region: str = "North America"
    status: Literal["Active", "At Risk", "Churned"] = "Active"
    joined: Optional[str] = None   # YYYY-MM-DD

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name cannot be empty")
        return v

    @field_validator("mrr", "ltv")
    @classmethod
    def non_negative(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Must be 0 or greater")
        return v
