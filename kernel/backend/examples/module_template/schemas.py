"""Pydantic schemas for the Invoicing module template.

Demonstrates gold-standard schema definitions meeting checklist rules S1-S8:
- S1: Class docstrings provide clean schema summaries.
- S2: Every field has human-readable descriptions and realistic examples.
- S3: Constraints (min_length, max_length, ge, format) are explicitly declared.
- S4: Enums are typed and documented with their business meaning.
- S5: Optional and nullable semantics accurately represent data requirements.
- S6: Complete json_schema_extra examples using Northwind enterprise data.
- S7: Consistent naming conventions (EntityCreate, EntityUpdate, EntityRead).
- S8: No internal identifiers or private state fields are exposed.
"""

from decimal import Decimal
from enum import Enum
import uuid
from pydantic import ConfigDict, Field

from kernel.core.schemas import AuditReadSchema, BaseSchema, Page


class InvoiceStatus(str, Enum):
    """Lifecycle status of a customer invoice.

    - `DRAFT`: Initial draft state; editable and not yet sent to customer.
    - `ISSUED`: Finalised and dispatched to customer; awaiting settlement.
    - `PAID`: Full payment received and reconciled against general ledger.
    - `CANCELLED`: Voided prior to payment; retained for audit trail integrity.
    """

    DRAFT = "DRAFT"
    ISSUED = "ISSUED"
    PAID = "PAID"
    CANCELLED = "CANCELLED"


class InvoiceItemCreate(BaseSchema):
    """Line item for invoice creation.

    Defines individual product or service billing records.
    """

    description: str = Field(
        min_length=1,
        max_length=255,
        description="Detailed product or service description.",
        examples=["Organic Darjeeling First Flush Tea (50kg Bag)"],
    )
    quantity: int = Field(
        ge=1,
        le=100000,
        description="Billed quantity in standard inventory units.",
        examples=[10],
    )
    unit_price: Decimal = Field(
        ge=Decimal("0.01"),
        description="Unit price per item excluding applicable taxes.",
        examples=[Decimal("2450.00")],
    )


class InvoiceCreate(BaseSchema):
    """Request payload for creating a new customer invoice."""

    customer_name: str = Field(
        min_length=2,
        max_length=150,
        description="Legal trading name of the customer organisation.",
        examples=["Northwind Traders Pvt Ltd"],
    )
    customer_email: str = Field(
        max_length=255,
        pattern=r"^[\w\.-]+@[\w\.-]+\.\w+$",
        description="Billing contact email address.",
        examples=["priya.shah@northwind.example"],
    )
    currency: str = Field(
        default="INR",
        min_length=3,
        max_length=3,
        description="ISO 4217 three-letter currency code.",
        examples=["INR"],
    )
    items: list[InvoiceItemCreate] = Field(
        min_length=1,
        description="List of billable line items attached to this invoice.",
    )
    notes: str | None = Field(
        default=None,
        max_length=1000,
        description="Optional customer-facing payment instructions or remarks.",
        examples=["Payment due within 30 days via NEFT/RTGS transfer."],
    )

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "customer_name": "Northwind Traders Pvt Ltd",
                    "customer_email": "priya.shah@northwind.example",
                    "currency": "INR",
                    "items": [
                        {
                            "description": "Organic Darjeeling First Flush Tea (50kg Bag)",
                            "quantity": 10,
                            "unit_price": "2450.00",
                        }
                    ],
                    "notes": "Payment due within 30 days via NEFT/RTGS transfer.",
                }
            ]
        }
    )


class InvoiceUpdate(BaseSchema):
    """Request payload for partially updating a draft invoice."""

    customer_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
        description="Updated legal trading name of the customer organisation.",
        examples=["Northwind Logistics Pvt Ltd"],
    )
    customer_email: str | None = Field(
        default=None,
        max_length=255,
        pattern=r"^[\w\.-]+@[\w\.-]+\.\w+$",
        description="Updated billing contact email address.",
        examples=["arjun.mehta@northwind.example"],
    )
    status: InvoiceStatus | None = Field(
        default=None,
        description="Updated invoice lifecycle status.",
        examples=[InvoiceStatus.ISSUED],
    )
    notes: str | None = Field(
        default=None,
        max_length=1000,
        description="Updated customer-facing payment instructions or remarks.",
        examples=["Immediate settlement requested."],
    )


class InvoiceItemRead(BaseSchema):
    """Read representation of an invoice line item."""

    id: uuid.UUID = Field(
        description="Unique line item identifier.",
        examples=["a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"],
    )
    description: str = Field(
        description="Detailed product or service description.",
        examples=["Organic Darjeeling First Flush Tea (50kg Bag)"],
    )
    quantity: int = Field(
        description="Billed quantity in standard inventory units.",
        examples=[10],
    )
    unit_price: Decimal = Field(
        description="Unit price per item excluding applicable taxes.",
        examples=[Decimal("2450.00")],
    )
    total_amount: Decimal = Field(
        description="Total computed amount (quantity * unit_price).",
        examples=[Decimal("24500.00")],
    )


class InvoiceRead(AuditReadSchema):
    """Complete public representation of a customer invoice.

    Inherits standard audit fields: `id`, `created_at`, `created_by`,
    `updated_at`, `updated_by`, `deleted_at`, `deleted_by`.
    """

    invoice_number: str = Field(
        description="Unique sequential invoice tracking code.",
        examples=["INV-2026-0042"],
    )
    customer_name: str = Field(
        description="Legal trading name of the customer organisation.",
        examples=["Northwind Traders Pvt Ltd"],
    )
    customer_email: str = Field(
        description="Billing contact email address.",
        examples=["priya.shah@northwind.example"],
    )
    currency: str = Field(
        description="ISO 4217 three-letter currency code.",
        examples=["INR"],
    )
    status: InvoiceStatus = Field(
        description="Current lifecycle status of the invoice.",
        examples=[InvoiceStatus.ISSUED],
    )
    subtotal: Decimal = Field(
        description="Total net amount before applicable taxes.",
        examples=[Decimal("24500.00")],
    )
    tax_amount: Decimal = Field(
        description="Calculated goods and services tax (18% GST).",
        examples=[Decimal("4410.00")],
    )
    total_amount: Decimal = Field(
        description="Total gross payable amount including tax.",
        examples=[Decimal("28910.00")],
    )
    items: list[InvoiceItemRead] = Field(
        description="Detailed list of billable line items.",
    )
    notes: str | None = Field(
        default=None,
        description="Optional customer-facing payment instructions or remarks.",
        examples=["Payment due within 30 days via NEFT/RTGS transfer."],
    )

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "id": "7b1c4e2a-9f8d-4a3b-8c1e-2d3f4a5b6c7d",
                    "invoice_number": "INV-2026-0042",
                    "customer_name": "Northwind Traders Pvt Ltd",
                    "customer_email": "priya.shah@northwind.example",
                    "currency": "INR",
                    "status": "ISSUED",
                    "subtotal": "24500.00",
                    "tax_amount": "4410.00",
                    "total_amount": "28910.00",
                    "notes": "Payment due within 30 days via NEFT/RTGS transfer.",
                    "items": [
                        {
                            "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
                            "description": "Organic Darjeeling First Flush Tea (50kg Bag)",
                            "quantity": 10,
                            "unit_price": "2450.00",
                            "total_amount": "24500.00",
                        }
                    ],
                    "created_at": "2026-10-29T10:00:00Z",
                    "created_by": "11111111-1111-1111-1111-111111111111",
                    "updated_at": "2026-10-29T10:15:00Z",
                    "updated_by": "11111111-1111-1111-1111-111111111111",
                    "deleted_at": None,
                    "deleted_by": None,
                }
            ]
        }
    )


class InvoicePage(Page[InvoiceRead]):
    """Paginated collection envelope for customer invoices."""
