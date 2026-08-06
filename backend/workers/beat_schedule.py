"""
Celery Beat periodic tasks.
Add this module to celery_app.conf.beat_schedule, or use:
  celery -A backend.workers.celery_app beat --loglevel=info
"""
from __future__ import annotations

from celery.schedules import crontab

from backend.workers.celery_app import celery_app

celery_app.conf.beat_schedule = {
    # Refresh pre-aggregated revenue snapshots every night at 02:00 UTC
    "refresh-revenue-snapshots": {
        "task": "nexus.refresh_revenue_snapshots",
        "schedule": crontab(hour=2, minute=0),
    },
    # Recompute RFM scores and customer segment labels nightly at 02:30 UTC
    "refresh-rfm-scores": {
        "task": "nexus.refresh_rfm_scores",
        "schedule": crontab(hour=2, minute=30),
    },
    # Refresh churn/at-risk classifications every 6 hours
    "refresh-churn-status": {
        "task": "nexus.refresh_churn_status",
        "schedule": crontab(hour="*/6", minute=0),
    },
    # Generate weekly executive summary report every Monday at 07:00 UTC
    "weekly-executive-report": {
        "task": "nexus.generate_scheduled_report",
        "schedule": crontab(hour=7, minute=0, day_of_week=1),
        "kwargs": {"report_type": "Executive", "label": "Weekly Summary"},
    },
    # Generate monthly report on 1st of each month at 06:00 UTC
    "monthly-report": {
        "task": "nexus.generate_scheduled_report",
        "schedule": crontab(hour=6, minute=0, day_of_month=1),
        "kwargs": {"report_type": "Monthly", "label": "Monthly Review"},
    },
}


@celery_app.task(name="nexus.refresh_revenue_snapshots")
def refresh_revenue_snapshots() -> str:
    """
    Recalculates monthly revenue_snapshot rows from raw transactions.
    Replace the stub below with your aggregation query once the
    transactions table is populated.
    """
    import asyncio
    asyncio.get_event_loop().run_until_complete(_refresh_snapshots())
    return "revenue_snapshots refreshed"


@celery_app.task(name="nexus.refresh_rfm_scores")
def refresh_rfm_scores() -> str:
    """Recomputes customer_rfm rows for all customers."""
    import asyncio
    asyncio.get_event_loop().run_until_complete(_refresh_rfm())
    return "rfm_scores refreshed"


@celery_app.task(name="nexus.refresh_churn_status")
def refresh_churn_status() -> str:
    """Updates Customer.status based on recency thresholds."""
    import asyncio
    asyncio.get_event_loop().run_until_complete(_refresh_churn())
    return "churn_status refreshed"


@celery_app.task(name="nexus.generate_scheduled_report")
def generate_scheduled_report(report_type: str = "Executive", label: str = "Scheduled Report") -> str:
    """
    Auto-generate a PDF report on schedule.
    Creates a Job row, runs PDF generation, and marks it ready.
    In production, you would also email the PDF to org admins.
    """
    import asyncio
    asyncio.get_event_loop().run_until_complete(_auto_generate_report(report_type, label))
    return f"scheduled_report generated: {label}"


async def _refresh_snapshots() -> None:
    from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
    from backend.core.config import get_settings
    settings = get_settings()
    engine = create_async_engine(settings.database_url, echo=False)
    # TODO: implement aggregation from transactions → revenue_snapshots
    await engine.dispose()


async def _refresh_rfm() -> None:
    from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
    from sqlalchemy import select
    from backend.core.config import get_settings
    from backend.models.customer import Customer
    from backend.models.revenue_snapshot import CustomerRFM
    from backend.analytics.rfm import compute_rfm

    settings = get_settings()
    engine = create_async_engine(settings.database_url, echo=False)
    SessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False)

    async with SessionLocal() as db:
        result = await db.execute(select(Customer))
        customers = result.scalars().all()
        for c in customers:
            rfm = compute_rfm(c.last_activity, c.frequency, c.ltv)
            # Upsert customer_rfm row
            existing = await db.get(CustomerRFM, c.id)
            if existing:
                existing.recency_score = rfm.recency_score
                existing.frequency_score = rfm.frequency_score
                existing.monetary_score = rfm.monetary_score
                existing.segment = rfm.segment
                existing.recency_label = rfm.recency_label
            else:
                db.add(CustomerRFM(
                    customer_id=c.id,
                    recency_score=rfm.recency_score,
                    frequency_score=rfm.frequency_score,
                    monetary_score=rfm.monetary_score,
                    segment=rfm.segment,
                    recency_label=rfm.recency_label,
                ))
            c.segment = rfm.segment
        await db.commit()
    await engine.dispose()


async def _refresh_churn() -> None:
    from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
    from sqlalchemy import select
    from backend.core.config import get_settings
    from backend.models.customer import Customer, CustomerStatus
    from backend.analytics.churn import classify_status

    settings = get_settings()
    engine = create_async_engine(settings.database_url, echo=False)
    SessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False)

    async with SessionLocal() as db:
        result = await db.execute(select(Customer))
        for c in result.scalars().all():
            new_status = classify_status(c.last_activity, c.mrr)
            c.status = CustomerStatus(new_status)
        await db.commit()
    await engine.dispose()


async def _auto_generate_report(report_type: str, label: str) -> None:
    """Create a report record + job, generate the PDF, mark ready."""
    import uuid
    import datetime
    from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
    from backend.core.config import get_settings
    from backend.models.report import Report
    from backend.models.job import Job, JobStatus
    from backend.services.pdf_generator import write_pdf

    settings = get_settings()
    engine = create_async_engine(settings.database_url, echo=False)
    SessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False)

    async with SessionLocal() as db:
        # We need at least one org to attach the report to.
        from sqlalchemy import select
        from backend.models.org import Org
        orgs = (await db.execute(select(Org))).scalars().all()
        if not orgs:
            return

        for org in orgs:
            report_id = f"auto_{report_type.lower()}_{datetime.date.today().isoformat()}_{uuid.uuid4().hex[:6]}"
            report = Report(
                id=report_id,
                org_id=org.id,
                name=f"{label} — {datetime.date.today().strftime('%B %Y')}",
                type=report_type,
                author="System (Scheduled)",
                size="0 MB",
            )
            db.add(report)
            await db.flush()

            job_id = f"job_{report_id}"
            out_path = str(settings.storage_dir / f"{job_id}.pdf")
            write_pdf(out_path, report_id)

            import os
            size_mb = round(os.path.getsize(out_path) / 1024 / 1024, 2)
            report.size = f"{size_mb} MB"

            job = Job(
                id=job_id,
                report_id=report_id,
                status=JobStatus.ready,
                progress=100,
                file_path=out_path,
            )
            db.add(job)

        await db.commit()

    await engine.dispose()
