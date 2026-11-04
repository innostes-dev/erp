import unittest
from decimal import Decimal
from peopleops.payroll.services import PayrollService

class TestPayrollService(unittest.TestCase):
    def setUp(self):
        self.service = PayrollService()

    def test_calculate_epf(self):
        # Test basic < 15k
        epf = self.service.calculate_epf(Decimal('10000.00'))
        self.assertEqual(epf, Decimal('1200.00'))
        
        # Test basic > 15k with statutory ceiling
        epf = self.service.calculate_epf(Decimal('20000.00'))
        self.assertEqual(epf, Decimal('1800.00'))
        
        # Test without ceiling
        epf = self.service.calculate_epf(Decimal('20000.00'), epf_calculation_mode="ACTUAL")
        self.assertEqual(epf, Decimal('2400.00'))
        
        # Test disabled
        epf = self.service.calculate_epf(Decimal('10000.00'), enable_epf=False)
        self.assertEqual(epf, Decimal('0.00'))

    def test_calculate_esi(self):
        # Test gross < 21k
        employee_esi, employer_esi = self.service.calculate_esi(Decimal('10000.00'))
        self.assertEqual(employee_esi, Decimal('75.00'))
        self.assertEqual(employer_esi, Decimal('325.00'))
        
        # Test gross > 21k
        employee_esi, employer_esi = self.service.calculate_esi(Decimal('25000.00'))
        self.assertEqual(employee_esi, Decimal('0.00'))
        self.assertEqual(employer_esi, Decimal('0.00'))
        
        # Test disabled
        employee_esi, employer_esi = self.service.calculate_esi(Decimal('10000.00'), enable_esic=False)
        self.assertEqual(employee_esi, Decimal('0.00'))
        self.assertEqual(employer_esi, Decimal('0.00'))

    def test_calculate_professional_tax(self):
        pt = self.service.calculate_professional_tax(Decimal('10000.00'))
        self.assertEqual(pt, Decimal('0.00'))
        
        pt = self.service.calculate_professional_tax(Decimal('20000.00'))
        self.assertEqual(pt, Decimal('200.00'))

    def test_calculate_tds_115bac(self):
        # Up to 3L
        tds = self.service.calculate_tds_115bac(Decimal('250000.00'))
        self.assertEqual(tds, Decimal('0.00'))
        
        # 3L - 6L (5%)
        tds = self.service.calculate_tds_115bac(Decimal('400000.00'))
        self.assertEqual(tds, Decimal('5000.00'))
        
        # 6L - 9L (10%)
        tds = self.service.calculate_tds_115bac(Decimal('700000.00'))
        self.assertEqual(tds, Decimal('25000.00'))  # 15k + 10k
        
        # 9L - 12L (15%)
        tds = self.service.calculate_tds_115bac(Decimal('1000000.00'))
        self.assertEqual(tds, Decimal('60000.00')) # 15k + 30k + 15k
        
        # 12L - 15L (20%)
        tds = self.service.calculate_tds_115bac(Decimal('1300000.00'))
        self.assertEqual(tds, Decimal('110000.00')) # 15k + 30k + 45k + 20k

        # > 15L (30%)
        tds = self.service.calculate_tds_115bac(Decimal('1600000.00'))
        self.assertEqual(tds, Decimal('180000.00')) # 150k + 30k

    def test_compute_gross_to_net(self):
        earnings = {
            "BASIC": Decimal('20000.00'),
            "HRA": Decimal('10000.00')
        }
        deductions = {}
        
        result = self.service.compute_gross_to_net(earnings, deductions)
        
        self.assertEqual(result["gross_pay"], Decimal('30000.00'))
        self.assertEqual(result["deductions"]["EPF"], Decimal('1800.00'))
        self.assertEqual(result["deductions"]["ESIC"], Decimal('0.00')) # Gross > 21k
        self.assertEqual(result["deductions"]["PT"], Decimal('200.00'))
        self.assertEqual(result["deductions"]["TDS"], Decimal('250.00')) # 3.6L annual, 5% on 60k = 3000 / 12 = 250
        self.assertEqual(result["total_deductions"], Decimal('2250.00'))
        self.assertEqual(result["net_pay"], Decimal('27750.00'))

    def test_compute_gross_to_net_tds(self):
        earnings = {
            "BASIC": Decimal('40000.00'),
            "HRA": Decimal('20000.00')
        }
        deductions = {}
        
        result = self.service.compute_gross_to_net(earnings, deductions)
        
        self.assertEqual(result["gross_pay"], Decimal('60000.00')) # 7.2L annual
        self.assertEqual(result["deductions"]["EPF"], Decimal('1800.00'))
        self.assertEqual(result["deductions"]["PT"], Decimal('200.00'))
        self.assertEqual(result["deductions"]["TDS"], Decimal('2250.00')) # 7.2L annual: 15k (3-6) + 12k (6-7.2) = 27k / 12 = 2250 -> check if simplified tds formula works
        self.assertEqual(result["total_deductions"], Decimal('4250.00'))
        self.assertEqual(result["net_pay"], Decimal('55750.00'))

if __name__ == '__main__':
    unittest.main()
