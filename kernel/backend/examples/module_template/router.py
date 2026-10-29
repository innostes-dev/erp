"""FastAPI router for the Invoicing module template.

Demonstrates gold-standard endpoint documentation adhering to checklists E1-E17:
- E1: snake_case operation_id (<feature>_<action>).
- E2: Imperative summary <= 60 characters with no trailing full stop.
- E3: Public description before `\f` covers action, permissions, side effects, idempotency.
- E4: Exactly one described tag ("Invoices").
- E5: Explicit security declaration in openapi_extra.
- E6: Parameters have description, examples, formats, and validation constraints.
- E7: Validated request body with schema examples.
- E8: Explicit success status code, response_model, and response_description.
- E9: Precise error_responses mapping matching raised service errors.
- E11: Custom headers (X-Tenant-ID) explicitly documented.
- E12: Paginated lists using Page schema and max limit <= 200.
"""

from typing import Annotated
import uuid
from fastapi import APIRouter, Header, HTTPException, Path, Query, status

from kernel.core.schemas import error_responses
from kernel.core.services.errors import (
    ConflictError,
    ForbiddenError,
    NotFoundError,
    UnauthorizedError,
    UnprocessableContentError,
)
from .schemas import (
    InvoiceCreate,
    InvoicePage,
    InvoiceRead,
    InvoiceStatus,
)
from .services import invoice_service

router = APIRouter(prefix="/invoices", tags=["Invoices"])


@router.post(
    "",
    response_model=InvoiceRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a customer invoice",
    operation_id="invoices_create",
    response_description="The created customer invoice with computed taxes and line items.",
    responses=error_responses(
        UnauthorizedError,
        ForbiddenError,
        UnprocessableContentError,
        ConflictError,
    ),
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def create_invoice(
    payload: InvoiceCreate,
    x_tenant_id: Annotated[
        uuid.UUID,
        Header(
            description="Tenant identifier for multi-tenant data isolation.",
            examples=["3f2b1c9e-4d5a-6b7c-8e9f-0a1b2c3d4e5f"],
        ),
    ],
) -> InvoiceRead:
    """Create a new customer invoice with line items and computed taxes.

    Callable by authenticated users with accountant or billing administrative
    privileges. Computes net line totals, calculates applicable taxes (18% GST),
    and records an immutable creation audit timestamp. Not idempotent; repeated
    submissions generate separate sequential invoices.
    \f
    Args:
        payload: Invoice details and line items.
        x_tenant_id: Tenant context header.

    Returns:
        InvoiceRead object with generated UUID and fiscal totals.
    """
    try:
        return invoice_service.create_invoice(
            data=payload,
            tenant_id=x_tenant_id,
        )
    except ConflictError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.get(
    "",
    response_model=InvoicePage,
    status_code=status.HTTP_200_OK,
    summary="List customer invoices",
    operation_id="invoices_list",
    response_description="A paginated list of customer invoices matching filter criteria.",
    responses=error_responses(
        UnauthorizedError,
        ForbiddenError,
        UnprocessableContentError,
    ),
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def list_invoices(
    x_tenant_id: Annotated[
        uuid.UUID,
        Header(
            description="Tenant identifier for multi-tenant data isolation.",
            examples=["3f2b1c9e-4d5a-6b7c-8e9f-0a1b2c3d4e5f"],
        ),
    ],
    skip: Annotated[
        int,
        Query(
            ge=0,
            description="Number of records to skip for pagination offset.",
            examples=[0],
        ),
    ] = 0,
    limit: Annotated[
        int,
        Query(
            ge=1,
            le=200,
            description="Maximum number of invoice records to return (capped at 200).",
            examples=[20],
        ),
    ] = 20,
    status_filter: Annotated[
        InvoiceStatus | None,
        Query(
            alias="status",
            description="Optional filter by invoice lifecycle status.",
            examples=[InvoiceStatus.ISSUED],
        ),
    ] = None,
    include_deleted: Annotated[
        bool,
        Query(
            description="Whether to include soft-deleted invoices in results.",
            examples=[False],
        ),
    ] = False,
) -> InvoicePage:
    """Retrieve a paginated collection of customer invoices for the current tenant.

    Callable by authenticated tenant members. Results are ordered by creation
    date descending. Supports offset-based pagination and status filtering. Safe
    and idempotent.
    \f
    Args:
        x_tenant_id: Calling tenant identifier.
        skip: Pagination offset.
        limit: Page size limit (maximum 200).
        status_filter: Optional lifecycle status filter.
        include_deleted: If True, soft-deleted records are included.

    Returns:
        InvoicePage envelope with items array and total count.
    """
    items, total = invoice_service.list_invoices(
        tenant_id=x_tenant_id,
        skip=skip,
        limit=limit,
        status=status_filter,
        include_deleted=include_deleted,
    )
    return InvoicePage(items=items, total=total, offset=skip, limit=limit)


@router.get(
    "/{invoice_id}",
    response_model=InvoiceRead,
    status_code=status.HTTP_200_OK,
    summary="Get an invoice by ID",
    operation_id="invoices_get",
    response_description="The requested customer invoice details.",
    responses=error_responses(
        UnauthorizedError,
        ForbiddenError,
        NotFoundError,
        UnprocessableContentError,
    ),
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def get_invoice(
    invoice_id: Annotated[
        uuid.UUID,
        Path(
            description="Unique identifier of the invoice to retrieve.",
            examples=["7b1c4e2a-9f8d-4a3b-8c1e-2d3f4a5b6c7d"],
        ),
    ],
    x_tenant_id: Annotated[
        uuid.UUID,
        Header(
            description="Tenant identifier for multi-tenant data isolation.",
            examples=["3f2b1c9e-4d5a-6b7c-8e9f-0a1b2c3d4e5f"],
        ),
    ],
) -> InvoiceRead:
    """Retrieve detailed information for a specific customer invoice by ID.

    Callable by authenticated tenant members. Returns line-item breakdowns,
    computed taxes, and payment status. Safe and idempotent.
    \f
    Args:
        invoice_id: UUID of the target invoice.
        x_tenant_id: Calling tenant context.

    Returns:
        InvoiceRead object.
    """
    try:
        return invoice_service.get_invoice(
            invoice_id=invoice_id,
            tenant_id=x_tenant_id,
        )
    except NotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
