from pydantic import BaseModel


class Report(BaseModel):
    id: str
    name: str
    type: str
    updated: str
    size: str
    author: str


class GenerateResponse(BaseModel):
    job_id: str
    status: str
