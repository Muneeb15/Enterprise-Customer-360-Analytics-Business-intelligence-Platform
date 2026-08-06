from typing import Literal
from pydantic import BaseModel


class Kpi(BaseModel):
    label: str
    value: str
    delta: str
    tone: Literal["pos", "neg", "neutral"]
    hero: bool = False
