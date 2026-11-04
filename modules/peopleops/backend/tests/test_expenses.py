import unittest
import asyncio
from datetime import date
from decimal import Decimal
import uuid
from peopleops.expenses.services import ExpensesService
from peopleops.expenses.schemas import ExpenseClaimCreate, ExpenseLineItemCreate

class TestExpenses(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.service = ExpensesService()

    async def test_expenses_categories(self):
        result = await self.service.get_categories()
        self.assertIn("categories", result)
        self.assertEqual(len(result["categories"]), 2)
        self.assertEqual(result["categories"][0]["code"], "TRAVEL_CONVEYANCE")

    async def test_expenses_claims(self):
        result = await self.service.get_claims()
        self.assertIn("claims", result)
        self.assertEqual(len(result["claims"]), 1)
        self.assertEqual(result["claims"][0]["id"], "EXP-001")

    async def test_submit_claim_success(self):
        payload = ExpenseClaimCreate(
            title="Test Trip",
            business_purpose="Meet client",
            settlement_destination="NEXT_PAYROLL",
            line_items=[
                ExpenseLineItemCreate(
                    category_id=uuid.uuid4(),
                    expense_date=date.today(),
                    merchant_name="Uber",
                    amount=Decimal("450.00"),
                    tax_amount=Decimal("20.00"),
                    is_billable_to_client=True
                )
            ]
        )
        result = await self.service.submit_claim(payload)
        self.assertIn("claim_id", result)
        self.assertEqual(result["status"], "PENDING_MANAGER_REVIEW")
        self.assertEqual(result["total_amount"], 450.0)

    async def test_submit_claim_missing_receipt_error(self):
        payload = ExpenseClaimCreate(
            title="Expensive Trip",
            business_purpose="Meet CEO",
            settlement_destination="NEXT_PAYROLL",
            line_items=[
                ExpenseLineItemCreate(
                    category_id=uuid.uuid4(),
                    expense_date=date.today(),
                    merchant_name="Flight",
                    amount=Decimal("5000.00"), # Needs receipt since > 500
                    tax_amount=Decimal("200.00"),
                    is_billable_to_client=False,
                    receipt_storage_path=None
                )
            ]
        )
        with self.assertRaises(ValueError) as ctx:
            await self.service.submit_claim(payload)
        
        self.assertIn("Receipt is mandatory", str(ctx.exception))

    async def test_approve_claim(self):
        result = await self.service.approve_claim("EXP-123")
        self.assertEqual(result["claim_id"], "EXP-123")
        self.assertEqual(result["status"], "APPROVED_FOR_PAYROLL")

    async def test_reject_claim(self):
        result = await self.service.reject_claim("EXP-123")
        self.assertEqual(result["claim_id"], "EXP-123")
        self.assertEqual(result["status"], "REJECTED")

if __name__ == '__main__':
    unittest.main()
