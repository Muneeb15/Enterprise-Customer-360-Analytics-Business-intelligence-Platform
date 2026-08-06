"""
In-process job store — used only when Celery/Redis is not available (dev mode).
Production path: jobs are persisted in Postgres via models/job.py.
"""
from backend.models.schemas import Job

JOBS: dict[str, Job] = {}
