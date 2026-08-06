"""
PDF generation — same ReportLab logic, now writing to persistent storage.

Called by:
  - workers/tasks.py (Celery worker, production)
  - routers/reports.py BackgroundTask fallback (dev/no-Redis mode)
"""
from __future__ import annotations

import datetime
import time
from pathlib import Path


def write_pdf(output_path: str, report_id: str) -> None:
    """Write a one-page PDF to output_path using reportlab."""
    try:
        from reportlab.pdfgen import canvas  # type: ignore[import-untyped]
        from reportlab.lib.pagesizes import LETTER  # type: ignore[import-untyped]
    except ImportError as exc:
        raise RuntimeError("reportlab is not installed — run: pip install reportlab") from exc

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    c = canvas.Canvas(output_path, pagesize=LETTER)
    width, height = LETTER

    c.setFont("Helvetica-Bold", 18)
    c.drawString(72, height - 80, "Nexus Analytics")

    c.setFont("Helvetica", 12)
    c.drawString(72, height - 110, f"Report: {report_id}")

    c.setFont("Helvetica", 10)
    c.setFillColorRGB(0.4, 0.4, 0.4)
    c.drawString(72, height - 140, f"Generated: {datetime.datetime.utcnow().isoformat()}Z")

    c.setFont("Helvetica", 11)
    c.setFillColorRGB(0, 0, 0)
    c.drawString(72, height - 200, "Executive summary: performance over the reporting window")
    c.drawString(72, height - 220, "shows consistent expansion in the Enterprise Growth cohort.")
    c.save()


def generate_pdf_blocking(
    job_id: str,
    report_id: str,
    output_path: str,
    on_progress=None,  # noqa: ANN001
) -> None:
    """
    Blocking version used by BackgroundTasks in dev (no Celery).
    Calls on_progress(progress: int) at each step if provided.
    """
    steps = 10
    for step in range(1, steps + 1):
        time.sleep(0.5)
        if on_progress:
            on_progress(step * (100 // steps))

    write_pdf(output_path, report_id)
