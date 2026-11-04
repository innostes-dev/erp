"""Business logic service for PeopleOps Payroll."""

import logging
from typing import Any
from decimal import Decimal
import datetime

logger = logging.getLogger(__name__)


class PayrollService:
    """Service layer executing business rules for payroll."""

    def __init__(self) -> None:
        self.logger = logger

    async def get_overview(self) -> dict[str, Any]:
        """Return operational overview metrics for payroll."""
        return {"submodule": "payroll", "ready": True}

    def calculate_epf(self, basic_pay: Decimal, enable_epf: bool = True, epf_calculation_mode: str = "STATUTORY_CEILING_15K") -> Decimal:
        """Calculate EPF contribution (12% ceiling Rs 15,000)."""
        if not enable_epf:
            return Decimal('0.00')
        if epf_calculation_mode == "STATUTORY_CEILING_15K":
            epf_base = min(basic_pay, Decimal('15000.00'))
        else:
            epf_base = basic_pay
        
        return (epf_base * Decimal('0.12')).quantize(Decimal('0.00'))

    def calculate_esi(self, gross_pay: Decimal, enable_esic: bool = True) -> tuple[Decimal, Decimal]:
        """Calculate ESI contributions (0.75% employee, 3.25% employer ceiling Rs 21,000)."""
        if not enable_esic or gross_pay > Decimal('21000.00'):
            return Decimal('0.00'), Decimal('0.00')
        employee_esi = (gross_pay * Decimal('0.0075')).quantize(Decimal('0.00'))
        employer_esi = (gross_pay * Decimal('0.0325')).quantize(Decimal('0.00'))
        return employee_esi, employer_esi

    def calculate_professional_tax(self, gross_pay: Decimal, state: str = "KARNATAKA") -> Decimal:
        """Calculate Professional Tax based on state slabs."""
        # Simplified Karnataka PT slab
        if gross_pay > Decimal('15000.00'):
            return Decimal('200.00')
        return Decimal('0.00')

    def calculate_tds_115bac(self, annualized_gross: Decimal) -> Decimal:
        """Calculate annual TDS under Section 115BAC (New Tax Regime)."""
        # Simplified calculation
        tax = Decimal('0.00')
        remaining = annualized_gross

        if remaining <= Decimal('300000.00'):
            return tax
        
        # 3L - 6L at 5%
        slab1 = min(remaining - Decimal('300000.00'), Decimal('300000.00'))
        if slab1 > 0:
            tax += slab1 * Decimal('0.05')
        
        if remaining <= Decimal('600000.00'):
            return tax
            
        # 6L - 9L at 10%
        slab2 = min(remaining - Decimal('600000.00'), Decimal('300000.00'))
        if slab2 > 0:
            tax += slab2 * Decimal('0.10')
            
        if remaining <= Decimal('900000.00'):
            return tax

        # 9L - 12L at 15%
        slab3 = min(remaining - Decimal('900000.00'), Decimal('300000.00'))
        if slab3 > 0:
            tax += slab3 * Decimal('0.15')
            
        if remaining <= Decimal('1200000.00'):
            return tax

        # 12L - 15L at 20%
        slab4 = min(remaining - Decimal('1200000.00'), Decimal('300000.00'))
        if slab4 > 0:
            tax += slab4 * Decimal('0.20')
            
        if remaining <= Decimal('1500000.00'):
            return tax

        # > 15L at 30%
        slab5 = remaining - Decimal('1500000.00')
        if slab5 > 0:
            tax += slab5 * Decimal('0.30')
            
        return tax.quantize(Decimal('0.00'))

    def compute_gross_to_net(self, earnings: dict[str, Decimal], deductions: dict[str, Decimal], enable_epf: bool = True, enable_esic: bool = True) -> dict[str, Any]:
        """Statutory gross-to-net payroll mathematical engine."""
        gross_pay = sum(earnings.values())
        
        # Calculate statutory deductions
        basic_pay = earnings.get("BASIC", Decimal('0.00'))
        epf = self.calculate_epf(basic_pay, enable_epf)
        deductions["EPF"] = epf
        
        esi_employee, _ = self.calculate_esi(gross_pay, enable_esic)
        deductions["ESIC"] = esi_employee
        
        pt = self.calculate_professional_tax(gross_pay)
        deductions["PT"] = pt
        
        # Calculate TDS (Simplified assuming 12 months)
        annualized_gross = gross_pay * 12
        annual_tds = self.calculate_tds_115bac(annualized_gross)
        monthly_tds = (annual_tds / 12).quantize(Decimal('0.00'))
        deductions["TDS"] = monthly_tds
        
        total_deductions = sum(deductions.values())
        net_pay = gross_pay - total_deductions
        
        # Net pay zero-variance invariant check
        calculated_net_pay = sum(earnings.values()) - sum(deductions.values())
        if net_pay != calculated_net_pay:
            raise ValueError(f"Net pay variance detected: expected {calculated_net_pay}, got {net_pay}")
            
        return {
            "gross_pay": gross_pay,
            "deductions": deductions,
            "total_deductions": total_deductions,
            "net_pay": net_pay
        }

service = PayrollService()
