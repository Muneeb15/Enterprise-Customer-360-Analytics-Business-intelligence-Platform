from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date

from backend.dependencies import get_db, get_current_user, CurrentUser
from backend.schemas.customer import Customer, CustomerTransaction, Segment
from backend.schemas.customer_write import CustomerCreate
from backend.schemas.pagination import PaginatedResponse
from backend.services import customer_service
from backend.models.customer import Customer as CustomerModel, CustomerStatus
from backend.models.revenue_snapshot import CustomerRFM
from backend.analytics.rfm import compute_rfm
from backend.utils.fallback import with_seed_fallback
from backend.data.seed import CUSTOMERS as SEED_CUSTOMERS, SEGMENTS as SEED_SEGMENTS
from backend.data.seed import get_customer_transactions as seed_txs

router = APIRouter(tags=["customers"])


@router.get("/customers", response_model=PaginatedResponse[Customer])
async def list_customers(
    segment: str | None = Query(default=None),
    status: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> PaginatedResponse[Customer]:
    seed = customer_service.filter_seed(SEED_CUSTOMERS, segment=segment, status=status)
    all_items: list[Customer] = await with_seed_fallback(
        lambda: customer_service.get_customers(db, org_id=current_user.org_id, segment=segment, status=status),
        seed,
    )
    total = len(all_items)
    start = (page - 1) * page_size
    return PaginatedResponse.build(all_items[start : start + page_size], total, page, page_size)


@router.get("/customers/{customer_id}", response_model=Customer)
async def get_customer(
    customer_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> Customer:
    customer = await with_seed_fallback(
        lambda: customer_service.get_customer(db, org_id=current_user.org_id, customer_id=customer_id),
        next((c for c in SEED_CUSTOMERS if c.id == customer_id), None),
    )
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.get("/customers/{customer_id}/transactions", response_model=list[CustomerTransaction])
async def get_transactions(
    customer_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> list[CustomerTransaction]:
    # Verify ownership — 404 if customer not in this org or in seed
    customer = await with_seed_fallback(
        lambda: customer_service.get_customer(db, org_id=current_user.org_id, customer_id=customer_id),
        next((c for c in SEED_CUSTOMERS if c.id == customer_id), None),
    )
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")

    return await with_seed_fallback(
        lambda: customer_service.get_transactions(db, customer_id=customer_id),
        seed_txs(customer_id),
    )


@router.get("/segments", response_model=list[Segment])
async def list_segments(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> list[Segment]:
    return await with_seed_fallback(
        lambda: customer_service.get_segments(db, org_id=current_user.org_id),
        SEED_SEGMENTS,
    )


@router.post("/customers", response_model=Customer, status_code=201)
async def create_customer(
    body: CustomerCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> Customer:
    """Create a single customer manually from the UI."""
    joined = date.today()
    if body.joined:
        try:
            joined = date.fromisoformat(body.joined)
        except ValueError:
            raise HTTPException(status_code=422, detail="joined must be YYYY-MM-DD")

    status_map = {
        "Active": CustomerStatus.active,
        "At Risk": CustomerStatus.at_risk,
        "Churned": CustomerStatus.churned,
    }

    c = CustomerModel(
        org_id=current_user.org_id,
        name=body.name,
        email=body.email or None,
        status=status_map[body.status],
        segment=body.segment,
        region=body.region,
        mrr=body.mrr,
        ltv=body.ltv,
        frequency=0,
        monetary=min(5, max(1, body.ltv // 100_000 + 1)),
        joined=joined,
    )
    db.add(c)
    await db.flush()

    # Compute and store RFM
    rfm = compute_rfm(None, 0, body.ltv)
    db.add(CustomerRFM(
        customer_id=c.id,
        recency_score=rfm.recency_score,
        frequency_score=rfm.frequency_score,
        monetary_score=rfm.monetary_score,
        segment=rfm.segment,
        recency_label=rfm.recency_label,
    ))
    await db.commit()

    return customer_service._to_customer_schema(c)
