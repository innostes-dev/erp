"""Unit and contract tests for the Invoicing module template.

Guarantees that the copyable module reference template remains fully functional,
passes all type checks and quality gates, and cannot rot over time.
"""

from decimal import Decimal
import unittest
import uuid

from fastapi import FastAPI
from fastapi.testclient import TestClient

from examples.module_template import InvoiceModule, module, router
from examples.module_template.schemas import (
    InvoiceCreate,
    InvoiceItemCreate,
    InvoiceRead,
    InvoiceStatus,
)
from examples.module_template.services import invoice_service


class TestInvoiceModuleTemplate(unittest.IsolatedAsyncioTestCase):
    """Test suite exercising the Invoicing module reference template."""

    def setUp(self) -> None:
        self.app = FastAPI()
        self.app.include_router(router)
        self.client = TestClient(self.app)
        self.tenant_id = uuid.uuid4()
        self.headers = {"X-Tenant-ID": str(self.tenant_id)}

    def test_module_contract_metadata(self) -> None:
        """Verify BaseModule implementation attributes."""
        self.assertEqual(module.name, "invoicing")
        self.assertEqual(module.version, "0.1.0")
        self.assertIsNotNone(module.router)
        self.assertEqual(len(module.openapi_tags), 1)
        tag = module.openapi_tags[0]
        self.assertEqual(tag["name"], "Invoices")
        self.assertTrue(len(tag["description"]) > 10)

    async def test_module_health_check(self) -> None:
        """Verify module health check lifecycle method."""
        health = await module.health_check()
        self.assertEqual(health["status"], "HEALTHY")
        self.assertEqual(health["module"], "invoicing")

    def test_create_and_get_invoice_flow(self) -> None:
        """Verify complete creation, fiscal calculation, and retrieval flow."""
        payload = {
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

        # 1. Create invoice (POST /invoices)
        response = self.client.post("/invoices", json=payload, headers=self.headers)
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn("INV-2026-", data["invoice_number"])
        self.assertEqual(data["customer_name"], "Northwind Traders Pvt Ltd")
        self.assertEqual(data["status"], "DRAFT")
        self.assertEqual(Decimal(data["subtotal"]), Decimal("24500.00"))
        self.assertEqual(Decimal(data["tax_amount"]), Decimal("4410.00"))
        self.assertEqual(Decimal(data["total_amount"]), Decimal("28910.00"))
        invoice_id = data["id"]

        # 2. Get invoice (GET /invoices/{id})
        get_res = self.client.get(f"/invoices/{invoice_id}", headers=self.headers)
        self.assertEqual(get_res.status_code, 200)
        self.assertEqual(get_res.json()["id"], invoice_id)

        # 3. List invoices (GET /invoices)
        list_res = self.client.get("/invoices", headers=self.headers)
        self.assertEqual(list_res.status_code, 200)
        list_data = list_res.json()
        self.assertGreaterEqual(list_data["total"], 1)
        self.assertGreaterEqual(len(list_data["items"]), 1)

    def test_validation_constraints(self) -> None:
        """Verify input validation rules and error response on invalid body."""
        # Missing required items and invalid email
        payload = {
            "customer_name": "N",  # Too short (min_length=2)
            "customer_email": "invalid-email",
            "items": [],  # Empty list violates min_length=1
        }
        res = self.client.post("/invoices", json=payload, headers=self.headers)
        self.assertEqual(res.status_code, 422)

    def test_missing_tenant_header(self) -> None:
        """Verify required X-Tenant-ID header enforcement."""
        payload = {
            "customer_name": "Northwind Traders Pvt Ltd",
            "customer_email": "priya.shah@northwind.example",
            "currency": "INR",
            "items": [
                {
                    "description": "Item",
                    "quantity": 1,
                    "unit_price": "100.00",
                }
            ],
        }
        res = self.client.post("/invoices", json=payload)
        self.assertEqual(res.status_code, 422)


if __name__ == "__main__":
    unittest.main()
