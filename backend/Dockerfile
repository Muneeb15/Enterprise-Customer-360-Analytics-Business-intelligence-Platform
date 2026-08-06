FROM python:3.12-slim

WORKDIR /app

# System deps for asyncpg / cryptography
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps first for layer caching
COPY pyproject.toml ./
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir \
        fastapi==0.115.0 \
        "uvicorn[standard]==0.30.6" \
        pydantic==2.9.2 \
        pydantic-settings==2.4.0 \
        "sqlalchemy[asyncio]==2.0.35" \
        asyncpg==0.29.0 \
        alembic==1.13.3 \
        "redis==5.1.1" \
        "celery[redis]==5.4.0" \
        reportlab==4.2.2 \
        "python-jose[cryptography]==3.3.0" \
        "passlib[bcrypt]==1.7.4" \
        python-multipart==0.0.12 \
        structlog==24.4.0

# Copy source
COPY . /app/backend

ENV PYTHONPATH=/app

EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
