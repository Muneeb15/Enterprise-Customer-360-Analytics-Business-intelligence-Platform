from typing import Literal, Optional
from pydantic import BaseModel


class Job(BaseModel):
    job_id: str
    report_id: str
    status: Literal["queued", "running", "ready", "error"]
    progress: int  # 0–100
    pdf_url: Optional[str] = None
    error: Optional[str] = None
