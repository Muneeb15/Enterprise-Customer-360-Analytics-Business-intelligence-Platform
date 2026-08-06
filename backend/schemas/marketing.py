from pydantic import BaseModel


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
