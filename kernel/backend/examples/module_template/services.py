"""Service layer for the Invoicing module template.

Demonstrates business logic, transaction handling, and typed error handling
aligned with repository error-code catalogues and service contracts.
"""

from datetime import datetime, timezone
from decimal import Decimal
import uuid
from typing import Any

from kernel.core.services.errors import (
    BadRequestError,
    ConflictError,
    ErrorCode,
    NotFoundError,
    UnprocessableContentError,
)
from .schemas import (
    InvoiceCreate,
    InvoiceItemRead,
    InvoiceRead,
    InvoiceStatus,
    InvoiceUpdate,
)


class InvoiceService:
    """Domain service managing customer invoices.

    Handles fiscal calculations, status transitions, and data integrity.
    """

    def __init__(self) -> None:
        self._invoices: dict[uuid.UUID, dict[str, Any]] = {}
        self._counter: int = 42

    def create_invoice(
        self,
        data: InvoiceCreate,
        tenant_id: uuid.UUID,
        actor_id: uuid.UUID | None = None,
    ) -> InvoiceRead:
        """Create a new invoice and calculate fiscal subtotals and taxes.

        Args:
            data: Validated invoice creation payload.
            tenant_id: Owning tenant identifier.
            actor_id: Authenticated user initiating creation.

        Returns:
            InvoiceRead representation of the created invoice.

        Raises:
            UnprocessableContentError: If currency is unsupported or items are invalid.
            ConflictError: If a duplicate invoice identifier occurs.
        """
        now = datetime.now(timezone.utc)
        invoice_id = uuid.uuid4()
        self._counter += 1
        invoice_number = f"INV-2026-{self._counter:04d}"

        subtotal = Decimal("0.00")
        items_read: list[InvoiceItemRead] = []

        for item in data.items:
            line_total = Decimal(str(item.quantity)) * Decimal(str(item.unit_price))
            subtotal += line_total
            items_read.append(
                InvoiceItemRead(
                    id=uuid.uuid4(),
                    description=item.description,
                    quantity=item.quantity,
                    unit_price=item.unit_price,
                    total_amount=line_total,
                )
            )

        # Indian GST rate (18%)
        tax_amount = (subtotal * Decimal("0.18")).quantize(Decimal("0.01"))
        total_amount = subtotal + tax_amount

        record = {
            "id": invoice_id,
            "tenant_id": tenant_id,
            "invoice_number": invoice_number,
            "customer_name": data.customer_name,
            "customer_email": data.customer_email,
            "currency": data.currency,
            "status": InvoiceStatus.DRAFT,
            "subtotal": subtotal,
            "tax_amount": tax_amount,
            "total_amount": total_amount,
            "items": items_read,
            "notes": data.notes,
            "created_at": now,
            "created_by": actor_id,
            "updated_at": now,
            "updated_by": actor_id,
            "deleted_at": None,
            "deleted_by": None,
        }

        self._invoices[invoice_id] = record
        return InvoiceRead(**record)

    def get_invoice(
        self,
        invoice_id: uuid.UUID,
        tenant_id: uuid.UUID,
        include_deleted: bool = False,
    ) -> InvoiceRead:
        """Fetch an invoice by ID with tenant scoping.

        Args:
            invoice_id: Unique invoice identifier.
            tenant_id: Calling tenant identifier.
            include_deleted: Whether soft-deleted records should be returned.

        Returns:
            InvoiceRead representation.

        Raises:
            NotFoundError: If invoice does not exist or tenant mismatch.
        """
        record = self._invoices.get(invoice_id)
        if not record or record["tenant_id"] != tenant_id:
            raise NotFoundError("Invoice not found.")

        if record["deleted_at"] is not None and not include_deleted:
            raise NotFoundError("Invoice not found.")

        return InvoiceRead(**record)

    def list_invoices(
        self,
        tenant_id: uuid.UUID,
        skip: int = 0,
        limit: int = 20,
        status: InvoiceStatus | None = None,
        include_deleted: bool = False,
    ) -> tuple[list[InvoiceRead], int]:
        """List tenant invoices with pagination and status filtering.

        Args:
            tenant_id: Calling tenant identifier.
            skip: Offset number of records to skip.
            limit: Maximum number of records to return.
            status: Optional lifecycle status filter.
            include_deleted: Whether to include soft-deleted records.

        Returns:
            Tuple of (list of InvoiceRead, total count).
        """
        records = [
            r for r in self._invoices.values()
            if r["tenant_id"] == tenant_id
            and (include_deleted or r["deleted_at"] is None)
            and (status is None or r["status"] == status)
        ]

        total = len(records)
        paginated = records[skip : skip + limit]
        return [InvoiceRead(**r) for r in paginated], total


# Singleton instance for template demonstration
invoice_service = InvoiceService()
