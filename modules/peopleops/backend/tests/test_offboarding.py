import unittest
from decimal import Decimal
import uuid

from peopleops.offboarding.services import OffboardingService

class TestOffboardingService(unittest.TestCase):
    def setUp(self):
        self.service = OffboardingService()
        self.basic_salary = Decimal("60000.00")

    def test_calculate_gratuity_eligible(self):
        """Test gratuity calculation for tenure >= 5 years."""
        # 15 * 60000 * 6 / 26 = 207692.30769...
        gratuity = self.service.calculate_gratuity(self.basic_salary, 6)
        self.assertEqual(gratuity, Decimal("207692.31"))

    def test_calculate_gratuity_ineligible(self):
        """Test gratuity calculation for tenure < 5 years returns 0."""
        gratuity = self.service.calculate_gratuity(self.basic_salary, 4)
        self.assertEqual(gratuity, Decimal("0.00"))

    def test_calculate_leave_encashment(self):
        """Test leave encashment: Days * (Basic / 26)."""
        encashable_leaves = Decimal("10.5")
        # 10.5 * (60000 / 26) = 24230.769...
        encashment = self.service.calculate_leave_encashment(self.basic_salary, encashable_leaves)
        self.assertEqual(encashment, Decimal("24230.77"))

    def test_calculate_notice_shortfall_recovery(self):
        """Test notice shortfall recovery: Days * (Basic / 26)."""
        shortfall_days = 5
        # 5 * (60000 / 26) = 11538.461...
        recovery = self.service.calculate_notice_shortfall_recovery(self.basic_salary, shortfall_days)
        self.assertEqual(recovery, Decimal("11538.46"))

    def test_calculate_notice_shortfall_zero(self):
        """Test notice shortfall recovery when days <= 0."""
        recovery = self.service.calculate_notice_shortfall_recovery(self.basic_salary, 0)
        self.assertEqual(recovery, Decimal("0.00"))
        
        recovery_negative = self.service.calculate_notice_shortfall_recovery(self.basic_salary, -2)
        self.assertEqual(recovery_negative, Decimal("0.00"))

if __name__ == '__main__':
    unittest.main()
