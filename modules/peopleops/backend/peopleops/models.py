"""PeopleOps Canonical SQLAlchemy ORM Models.

This file serves as the single source of truth for database entities in the
HRMS (PeopleOps) module. All parallel agents and submodules import from here.
"""

from datetime import date, datetime
from decimal import Decimal
from typing import Any
import uuid

from sqlalchemy import (
    BigInteger,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import ARRAY, BYTEA, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from kernel.core.database.base import Base


# ============================================================================
# 0. DYNAMIC MASTERS
# ============================================================================

class HRMSDepartment(Base):
    """Department structural master entity."""

    __tablename__ = "hrms_departments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    code: Mapped[str] = mapped_column(String(64), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    parent_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("hrms_departments.id", ondelete="SET NULL"), nullable=True)
    manager_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    cost_center_code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_system: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("tenant_id", "code", name="uq_tenant_dept_code"),
    )


class HRMSDesignation(Base):
    """Designation functional title master entity."""

    __tablename__ = "hrms_designations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    code: Mapped[str] = mapped_column(String(64), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    job_family: Mapped[str | None] = mapped_column(String(64), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_system: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("tenant_id", "code", name="uq_tenant_desig_code"),
    )


class HRMSLocation(Base):
    """Office location and branches master entity with geofencing."""

    __tablename__ = "hrms_locations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    code: Mapped[str] = mapped_column(String(64), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    physical_address: Mapped[str] = mapped_column(Text, nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    country_code: Mapped[str] = mapped_column(String(2), default="IN", nullable=False)
    timezone: Mapped[str] = mapped_column(String(64), default="Asia/Kolkata", nullable=False)
    latitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 7), nullable=True)
    longitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 7), nullable=True)
    geofence_radius_meters: Mapped[int] = mapped_column(Integer, default=200, nullable=False)
    ip_whitelist_cidrs: Mapped[list[str] | None] = mapped_column(ARRAY(Text), default=list, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_system: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("tenant_id", "code", name="uq_tenant_loc_code"),
    )


class HRMSHolidayCalendar(Base):
    """Holiday calendar schedule header."""

    __tablename__ = "hrms_holiday_calendars"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    code: Mapped[str] = mapped_column(String(64), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    calendar_year: Mapped[int] = mapped_column(Integer, nullable=False)
    location_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("hrms_locations.id", ondelete="SET NULL"), nullable=True)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("tenant_id", "code", name="uq_tenant_cal_code"),
        Index("idx_hrms_holiday_cal", "tenant_id", "calendar_year", "location_id"),
    )


class HRMSHoliday(Base):
    """Individual calendar holiday date."""

    __tablename__ = "hrms_holidays"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    calendar_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("hrms_holiday_calendars.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    holiday_date: Mapped[date] = mapped_column(Date, nullable=False)
    holiday_type: Mapped[str] = mapped_column(String(32), default="MANDATORY", nullable=False)
    is_half_day: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    half_day_period: Mapped[str | None] = mapped_column(String(16), default="FULL_DAY", nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    observed_substitute_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("calendar_id", "holiday_date", name="uq_calendar_holiday_date"),
        Index("idx_hrms_holidays_date", "tenant_id", "holiday_date"),
    )


class HRMSPicklist(Base):
    """Dynamic lightweight picklist entity (eliminating hardcoded enums)."""

    __tablename__ = "hrms_picklists"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(64), nullable=False)
    code: Mapped[str] = mapped_column(String(64), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_system: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("tenant_id", "category", "code", name="uq_tenant_picklist_code"),
        Index("idx_hrms_picklists", "tenant_id", "category", "is_active", "display_order"),
    )


# ============================================================================
# 1. PARTY & IDENTITY CORE
# ============================================================================

class HRMSParty(Base):
    """Party record representing an individual human being."""

    __tablename__ = "hrms_parties"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    salutation: Mapped[str | None] = mapped_column(String(16), nullable=True)
    legal_first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    legal_middle_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    legal_last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    display_name: Mapped[str] = mapped_column(String(150), nullable=False)
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)
    gender: Mapped[str] = mapped_column(String(32), nullable=False)
    marital_status: Mapped[str | None] = mapped_column(String(32), nullable=True)
    marriage_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    blood_group: Mapped[str | None] = mapped_column(String(16), nullable=True)
    nationality: Mapped[str] = mapped_column(String(2), default="IN", nullable=False)
    father_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    mother_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    spouse_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    is_differently_abled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    disability_details: Mapped[str | None] = mapped_column(Text, nullable=True)
    personal_email: Mapped[str] = mapped_column(String(255), nullable=False)
    mobile_phone: Mapped[str] = mapped_column(String(32), nullable=False)
    alternate_phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("idx_hrms_parties_tenant", "tenant_id"),
    )


class KernelAadhaarVault(Base):
    """Aadhaar Data Vault (ADV) isolated ciphertext storage."""

    __tablename__ = "kernel_aadhaar_vault"

    reference_key: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    party_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("hrms_parties.id", ondelete="CASCADE"), nullable=False)
    aadhaar_ciphertext: Mapped[bytes] = mapped_column(BYTEA, nullable=False)
    dek_wrapped: Mapped[bytes] = mapped_column(BYTEA, nullable=False)
    kek_version: Mapped[str] = mapped_column(String(32), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)


class HRMSStatutoryIdentity(Base):
    """Encrypted statutory identities (PAN, UAN, ESIC, Passport)."""

    __tablename__ = "hrms_statutory_identities"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    party_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("hrms_parties.id", ondelete="CASCADE"), nullable=False)
    aadhaar_reference_key: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("kernel_aadhaar_vault.reference_key"), nullable=True)
    aadhaar_masked: Mapped[str | None] = mapped_column(String(20), nullable=True)
    aadhaar_virtual_id: Mapped[str | None] = mapped_column(String(20), nullable=True)
    pan_number_enc: Mapped[bytes | None] = mapped_column(BYTEA, nullable=True)
    pan_number_masked: Mapped[str | None] = mapped_column(String(15), nullable=True)
    pan_search_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    uan_number: Mapped[str | None] = mapped_column(String(12), nullable=True)
    previous_pf_member_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    esic_number: Mapped[str | None] = mapped_column(String(17), nullable=True)
    professional_tax_state: Mapped[str | None] = mapped_column(String(64), nullable=True)
    lwf_state_code: Mapped[str | None] = mapped_column(String(16), nullable=True)
    passport_number_enc: Mapped[bytes | None] = mapped_column(BYTEA, nullable=True)
    passport_expiry_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    passport_place_of_issue: Mapped[str | None] = mapped_column(String(100), nullable=True)
    visa_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    visa_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    visa_expiry_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    driving_license_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    voter_id_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    us_ssn_enc: Mapped[bytes | None] = mapped_column(BYTEA, nullable=True)
    us_ssn_masked: Mapped[str | None] = mapped_column(String(15), nullable=True)
    uk_nino_enc: Mapped[bytes | None] = mapped_column(BYTEA, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("tenant_id", "party_id", name="uq_party_statutory"),
        Index("idx_hrms_statutory_pan_hash", "tenant_id", "pan_search_hash"),
    )


class HRMSAddress(Base):
    """Employee physical address record."""

    __tablename__ = "hrms_addresses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    party_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("hrms_parties.id", ondelete="CASCADE"), nullable=False)
    type: Mapped[str] = mapped_column(String(32), nullable=False)
    address_line1: Mapped[str] = mapped_column(String(255), nullable=False)
    address_line2: Mapped[str | None] = mapped_column(String(255), nullable=True)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    district: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    postal_code: Mapped[str] = mapped_column(String(20), nullable=False)
    country_code: Mapped[str] = mapped_column(String(2), default="IN", nullable=False)
    residence_type: Mapped[str] = mapped_column(String(32), default="RENTED", nullable=False)
    is_same_as_current: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    proof_document_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("party_id", "type", name="uq_party_address_type"),
    )


class HRMSEmergencyContact(Base):
    """Emergency contact record."""

    __tablename__ = "hrms_emergency_contacts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    party_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("hrms_parties.id", ondelete="CASCADE"), nullable=False)
    contact_name: Mapped[str] = mapped_column(String(150), nullable=False)
    relationship: Mapped[str] = mapped_column(String(64), nullable=False)
    primary_phone: Mapped[str] = mapped_column(String(32), nullable=False)
    alternate_phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    residential_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)


class HRMSBankAccount(Base):
    """Direct deposit and salary disbursement bank account."""

    __tablename__ = "hrms_bank_accounts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    party_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("hrms_parties.id", ondelete="CASCADE"), nullable=False)
    bank_name: Mapped[str] = mapped_column(String(150), nullable=False)
    branch_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    branch_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    account_number_enc: Mapped[bytes] = mapped_column(BYTEA, nullable=False)
    account_number_masked: Mapped[str] = mapped_column(String(30), nullable=False)
    account_number_search_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    account_type: Mapped[str] = mapped_column(String(64), default="SALARY_CORPORATE", nullable=False)
    routing_identifier: Mapped[str] = mapped_column(String(64), nullable=False)
    routing_identifier_type: Mapped[str] = mapped_column(String(32), default="IFSC", nullable=False)
    micr_code: Mapped[str | None] = mapped_column(String(9), nullable=True)
    account_holder_name: Mapped[str] = mapped_column(String(150), nullable=False)
    penny_drop_status: Mapped[str] = mapped_column(String(32), default="PENDING", nullable=False)
    disbursal_mode: Mapped[str] = mapped_column(String(64), default="NEFT", nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_hrms_bank_hash", "tenant_id", "account_number_search_hash"),
    )


# ============================================================================
# 2. EMPLOYEE & CONTRACTS
# ============================================================================

class HRMSEmployee(Base):
    """Core employee operational master record."""

    __tablename__ = "hrms_employees"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    party_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("hrms_parties.id", ondelete="RESTRICT"), nullable=False)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    employee_code: Mapped[str] = mapped_column(String(32), nullable=False)
    biometric_badge_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    work_email: Mapped[str] = mapped_column(String(255), nullable=False)
    legal_entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    business_unit: Mapped[str | None] = mapped_column(String(64), nullable=True)
    department_code: Mapped[str] = mapped_column(String(64), nullable=False)
    sub_department: Mapped[str | None] = mapped_column(String(64), nullable=True)
    cost_center_code: Mapped[str | None] = mapped_column(String(32), nullable=True)
    designation_code: Mapped[str] = mapped_column(String(64), nullable=False)
    grade_band: Mapped[str | None] = mapped_column(String(64), nullable=True)
    manager_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("hrms_employees.id", ondelete="SET NULL"), nullable=True)
    dotted_line_manager_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("hrms_employees.id", ondelete="SET NULL"), nullable=True)
    hrbp_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("hrms_employees.id", ondelete="SET NULL"), nullable=True)
    location_code: Mapped[str] = mapped_column(String(64), default="HQ", nullable=False)
    work_mode: Mapped[str] = mapped_column(String(32), default="IN_OFFICE", nullable=False)
    shift_policy_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    holiday_calendar_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("hrms_holiday_calendars.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="DRAFT", nullable=False)
    hire_date: Mapped[date] = mapped_column(Date, nullable=False)
    probation_period_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    probation_end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    confirmation_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    notice_period_days: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    notice_start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    termination_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        UniqueConstraint("tenant_id", "employee_code", name="uq_tenant_employee_code"),
        UniqueConstraint("tenant_id", "work_email", name="uq_tenant_work_email"),
        Index("idx_hrms_employees_tenant", "tenant_id", "status"),
        Index("idx_hrms_employees_manager", "manager_id"),
    )


class HRMSContract(Base):
    """Employment contract and compensation term."""

    __tablename__ = "hrms_contracts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    employee_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("hrms_employees.id", ondelete="CASCADE"), nullable=False)
    contract_type: Mapped[str] = mapped_column(String(64), default="PERMANENT_FULL_TIME", nullable=False)
    base_salary: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)
    pay_frequency: Mapped[str] = mapped_column(String(32), default="MONTHLY", nullable=False)
    working_hours_per_week: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    effective_from: Mapped[date] = mapped_column(Date, nullable=False)
    effective_to: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)


# ============================================================================
# 3. ATTENDANCE & SHIFTS
# ============================================================================

class HRMSAttendancePunch(Base):
    """Raw clock punch entry."""

    __tablename__ = "hrms_attendance_punches"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    employee_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("hrms_employees.id", ondelete="CASCADE"), nullable=False)
    punch_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    direction: Mapped[str] = mapped_column(String(16), nullable=False)
    source: Mapped[str] = mapped_column(String(64), default="web", nullable=False)
    location_geo: Mapped[dict[str, Any] | None] = mapped_column(JSONB, default=dict, nullable=True)
    is_manual_override: Mapped[bool | None] = mapped_column(Boolean, default=False, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_hrms_punches_emp_time", "tenant_id", "employee_id", "punch_time"),
    )


class HRMSAttendanceBlock(Base):
    """Normalized attendance daily block."""

    __tablename__ = "hrms_attendance_blocks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    employee_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("hrms_employees.id", ondelete="CASCADE"), nullable=False)
    work_date: Mapped[date] = mapped_column(Date, nullable=False)
    in_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    out_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    total_duration_minutes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    late_minutes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    overtime_minutes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    work_location: Mapped[str] = mapped_column(String(32), default="office", nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="NORMAL", nullable=False)

    __table_args__ = (
        UniqueConstraint("tenant_id", "employee_id", "work_date", "in_time", name="uq_emp_date_in"),
        Index("idx_hrms_attendance_date", "tenant_id", "work_date"),
    )


class HRMSMonthlyTimesheet(Base):
    """Monthly timesheet rollup for payroll LOP ingestion."""

    __tablename__ = "hrms_monthly_timesheets"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    employee_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("hrms_employees.id", ondelete="CASCADE"), nullable=False)
    manager_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("hrms_employees.id", ondelete="SET NULL"), nullable=True)
    period_month: Mapped[str] = mapped_column(String(7), nullable=False)
    total_present_days: Mapped[Decimal] = mapped_column(Numeric(4, 1), default=0.0, nullable=False)
    total_absent_days: Mapped[Decimal] = mapped_column(Numeric(4, 1), default=0.0, nullable=False)
    total_leave_days: Mapped[Decimal] = mapped_column(Numeric(4, 1), default=0.0, nullable=False)
    total_worked_hours: Mapped[Decimal] = mapped_column(Numeric(6, 2), default=0.0, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="DRAFT", nullable=False)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    approved_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("hrms_employees.id", ondelete="SET NULL"), nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    rejection_comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("tenant_id", "employee_id", "period_month", name="uq_emp_monthly_timesheet"),
        Index("idx_hrms_timesheet_mgr", "tenant_id", "manager_id", "status"),
    )


# ============================================================================
# 4. LEAVE GOVERNANCE & LEDGER
# ============================================================================

class HRMSLeaveType(Base):
    """Leave policy and quota configuration."""

    __tablename__ = "hrms_leave_types"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    code: Mapped[str] = mapped_column(String(32), nullable=False)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    color_hex: Mapped[str] = mapped_column(String(7), default="#3B82F6", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_system: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_unlimited: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    annual_quota: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=12.00, nullable=False)
    accrual_frequency: Mapped[str] = mapped_column(String(32), default="ANNUAL_LUMP_SUM", nullable=False)
    accrual_timing: Mapped[str] = mapped_column(String(32), default="BEGINNING_OF_PERIOD", nullable=False)
    proration_rule: Mapped[str] = mapped_column(String(32), default="EXACT_DAYS", nullable=False)
    can_carry_forward: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    carry_forward_cap: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=0.00, nullable=False)
    carry_forward_expiry_months: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_encashable: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    encashment_mode: Mapped[str] = mapped_column(String(32), default="UPON_SEPARATION_ONLY", nullable=False)
    encashment_salary_basis: Mapped[str] = mapped_column(String(32), default="BASIC_SALARY", nullable=False)
    encashment_min_balance_retained: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=0.00, nullable=False)
    encashment_max_days_per_year: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=0.00, nullable=False)
    allow_half_day: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    min_notice_days: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    max_consecutive_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    allow_past_dating: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    max_past_days: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    allow_negative_balance: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    max_negative_days: Mapped[Decimal] = mapped_column(Numeric(4, 2), default=0.00, nullable=False)
    requires_attachment: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    attachment_mandatory_above_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    include_weekends: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    include_holidays: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    sandwich_rule_mode: Mapped[str] = mapped_column(String(32), default="DISABLED", nullable=False)
    probation_rule: Mapped[str] = mapped_column(String(32), default="FULL_ACCESS", nullable=False)
    notice_period_rule: Mapped[str] = mapped_column(String(32), default="MANAGER_DISCRETION", nullable=False)
    applicable_gender: Mapped[str] = mapped_column(String(32), default="ALL", nullable=False)
    applicable_employment_types: Mapped[list[str] | None] = mapped_column(ARRAY(String(64)), default=list, nullable=True)
    approval_workflow: Mapped[str] = mapped_column(String(32), default="SINGLE_LEVEL_MANAGER", nullable=False)
    auto_approve_if_below_days: Mapped[Decimal | None] = mapped_column(Numeric(3, 1), nullable=True)
    sla_hours: Mapped[int] = mapped_column(Integer, default=48, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("tenant_id", "code", name="uq_tenant_leave_code"),
    )


class HRMSLeaveApplication(Base):
    """Leave booking request."""

    __tablename__ = "hrms_leave_applications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    employee_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("hrms_employees.id", ondelete="CASCADE"), nullable=False)
    leave_type_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("hrms_leave_types.id"), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    start_half: Mapped[str] = mapped_column(String(16), default="FULL_DAY", nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_half: Mapped[str] = mapped_column(String(16), default="FULL_DAY", nullable=False)
    base_days: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    sandwich_days: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=0.00, nullable=False)
    total_days: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="PENDING", nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    supporting_document_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    manager_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("hrms_employees.id", ondelete="SET NULL"), nullable=True)
    skip_level_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("hrms_employees.id", ondelete="SET NULL"), nullable=True)
    approved_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("hrms_employees.id", ondelete="SET NULL"), nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_hrms_leave_app_emp", "tenant_id", "employee_id", "status"),
    )


class HRMSLeaveLedger(Base):
    """Double-entry immutable leave balance ledger."""

    __tablename__ = "hrms_leave_ledger"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    employee_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("hrms_employees.id", ondelete="CASCADE"), nullable=False)
    leave_type_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("hrms_leave_types.id"), nullable=False)
    transaction_date: Mapped[date] = mapped_column(Date, nullable=False)
    action: Mapped[str] = mapped_column(String(32), nullable=False)
    days: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    reference_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    remarks: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_leave_ledger_balance", "tenant_id", "employee_id", "leave_type_id"),
    )


# ============================================================================
# 5. PAYROLL ENGINE & SALARY STRUCTURES
# ============================================================================

class HRMSPayrollSetting(Base):
    """Tenant-level payroll and statutory configuration."""

    __tablename__ = "hrms_payroll_settings"

    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), primary_key=True)
    pay_frequency: Mapped[str] = mapped_column(String(32), default="MONTHLY", nullable=False)
    cycle_start_day: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    payout_day: Mapped[str] = mapped_column(String(32), default="LAST_DAY_OF_MONTH", nullable=False)
    lop_calculation_method: Mapped[str] = mapped_column(String(32), default="CALENDAR_DAYS", nullable=False)
    enable_epf: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    epf_calculation_mode: Mapped[str] = mapped_column(String(32), default="STATUTORY_CEILING_15K", nullable=False)
    epf_establishment_code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    enable_esic: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    esic_establishment_code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    enable_professional_tax: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    enable_lwf: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    enable_gratuity: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    default_tax_regime: Mapped[str] = mapped_column(String(32), default="SECTION_115BAC_NEW", nullable=False)
    allow_midyear_regime_switch: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    tax_declaration_window_end_day: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    bank_cms_format: Mapped[str] = mapped_column(String(64), default="HDFC_CMS", nullable=False)
    corporate_bank_account_number: Mapped[str | None] = mapped_column(String(64), nullable=True)
    corporate_bank_ifsc: Mapped[str | None] = mapped_column(String(32), nullable=True)
    gl_salary_expense_account_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    gl_salaries_payable_account_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    gl_tax_payable_account_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    auto_post_gl_journal: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    auto_dispatch_payslip_emails: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    payslip_password_formula: Mapped[str] = mapped_column(String(64), default="NAME4_DOB_DDMM", nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class HRMSSalaryComponent(Base):
    """Salary earning or deduction component."""

    __tablename__ = "hrms_salary_components"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    code: Mapped[str] = mapped_column(String(32), nullable=False)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    classification: Mapped[str] = mapped_column(String(64), nullable=False)
    calculation_mode: Mapped[str] = mapped_column(String(32), default="FLAT_AMOUNT", nullable=False)
    percentage_base: Mapped[str | None] = mapped_column(String(64), nullable=True)
    percentage_value: Mapped[Decimal | None] = mapped_column(Numeric(7, 4), nullable=True)
    formula_expression: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_lop_prorated: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_taxable: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    tax_exemption_code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    part_of_ctc: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    show_on_payslip: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    hide_if_zero: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    depends_on: Mapped[list[str] | None] = mapped_column(JSONB, default=list, nullable=True)

    __table_args__ = (
        UniqueConstraint("tenant_id", "code", name="uq_tenant_salary_comp"),
    )


class HRMSSalaryStructure(Base):
    """Salary package structure template."""

    __tablename__ = "hrms_salary_structures"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    code: Mapped[str] = mapped_column(String(64), nullable=False)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    rounding_rule: Mapped[str] = mapped_column(String(32), default="NEAREST_INTEGER", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("tenant_id", "code", name="uq_tenant_structure_code"),
    )


class HRMSSalaryStructureComponent(Base):
    """Component assignment and DAG order within a salary structure."""

    __tablename__ = "hrms_salary_structure_components"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    structure_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("hrms_salary_structures.id", ondelete="CASCADE"), nullable=False)
    component_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("hrms_salary_components.id", ondelete="RESTRICT"), nullable=False)
    sequence_order: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    calculation_mode_override: Mapped[str | None] = mapped_column(String(32), nullable=True)
    percentage_base_override: Mapped[str | None] = mapped_column(String(64), nullable=True)
    percentage_value_override: Mapped[Decimal | None] = mapped_column(Numeric(7, 4), nullable=True)
    formula_expression_override: Mapped[str | None] = mapped_column(Text, nullable=True)
    fixed_amount_override: Mapped[Decimal | None] = mapped_column(Numeric(18, 4), nullable=True)

    __table_args__ = (
        UniqueConstraint("structure_id", "component_id", name="uq_structure_component"),
        Index("idx_struct_comp_eval", "structure_id", "sequence_order"),
    )


class HRMSPayrollRun(Base):
    """Monthly gross-to-net payroll execution batch."""

    __tablename__ = "hrms_payroll_runs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    period_start: Mapped[date] = mapped_column(Date, nullable=False)
    period_end: Mapped[date] = mapped_column(Date, nullable=False)
    stage: Mapped[str] = mapped_column(String(32), default="DRAFT", nullable=False)
    total_gross_pay: Mapped[Decimal] = mapped_column(Numeric(18, 4), default=0.0000, nullable=False)
    total_net_pay: Mapped[Decimal] = mapped_column(Numeric(18, 4), default=0.0000, nullable=False)
    total_tax_withheld: Mapped[Decimal] = mapped_column(Numeric(18, 4), default=0.0000, nullable=False)
    processed_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    committed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    gl_journal_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)


class HRMSPayslip(Base):
    """Individual generated employee monthly payslip."""

    __tablename__ = "hrms_payslips"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    payroll_run_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("hrms_payroll_runs.id", ondelete="CASCADE"), nullable=False)
    employee_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("hrms_employees.id", ondelete="RESTRICT"), nullable=False)
    payslip_template_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    working_days: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    loss_of_pay_days: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=0.00, nullable=False)
    gross_pay: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False)
    total_deductions: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False)
    net_pay: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False)
    net_pay_in_words: Mapped[str] = mapped_column(Text, nullable=False)
    leave_balances_snapshot: Mapped[dict[str, Any] | None] = mapped_column(JSONB, default=dict, nullable=True)
    employer_retirals_snapshot: Mapped[dict[str, Any] | None] = mapped_column(JSONB, default=dict, nullable=True)
    ytd_totals_snapshot: Mapped[dict[str, Any] | None] = mapped_column(JSONB, default=dict, nullable=True)
    pdf_storage_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    verification_hash: Mapped[str | None] = mapped_column(String(128), nullable=True)

    __table_args__ = (
        UniqueConstraint("payroll_run_id", "employee_id", name="uq_run_emp"),
    )


# ============================================================================
# 6. EXPENSES & CLAIMS
# ============================================================================

class HRMSExpenseCategory(Base):
    """Expense category master."""

    __tablename__ = "hrms_expense_categories"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    code: Mapped[str] = mapped_column(String(64), nullable=False)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    max_limit_per_claim: Mapped[Decimal | None] = mapped_column(Numeric(18, 4), nullable=True)
    is_receipt_mandatory: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    receipt_threshold_amount: Mapped[Decimal] = mapped_column(Numeric(18, 4), default=500.0000, nullable=False)
    max_claim_age_days: Mapped[int] = mapped_column(Integer, default=60, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_tax_deductible_itc: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("tenant_id", "code", name="uq_tenant_exp_cat"),
    )


class HRMSExpenseClaimReport(Base):
    """Employee expense reimbursement claim envelope."""

    __tablename__ = "hrms_expense_claim_reports"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    employee_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("hrms_employees.id", ondelete="CASCADE"), nullable=False)
    claim_number: Mapped[str] = mapped_column(String(64), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    business_purpose: Mapped[str] = mapped_column(Text, nullable=False)
    cost_center: Mapped[str | None] = mapped_column(String(64), nullable=True)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(18, 4), default=0.0000, nullable=False)
    total_tax_amount: Mapped[Decimal] = mapped_column(Numeric(18, 4), default=0.0000, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="DRAFT", nullable=False)
    current_workflow_step: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    settlement_destination: Mapped[str] = mapped_column(String(32), default="NEXT_PAYROLL", nullable=False)
    payroll_run_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("hrms_payroll_runs.id", ondelete="SET NULL"), nullable=True)
    bank_disbursement_reference: Mapped[str | None] = mapped_column(String(128), nullable=True)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    settled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("tenant_id", "claim_number", name="uq_tenant_claim_no"),
    )


# ============================================================================
# 7. OFFBOARDING & FULL AND FINAL (F&F)
# ============================================================================

class HRMSSeparation(Base):
    """Employee separation lifecycle record."""

    __tablename__ = "hrms_separations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    employee_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("hrms_employees.id", ondelete="CASCADE"), nullable=False)
    exit_type: Mapped[str] = mapped_column(String(64), default="VOLUNTARY_RESIGNATION", nullable=False)
    separation_mode: Mapped[str] = mapped_column(String(32), default="ENTERPRISE", nullable=False)
    resignation_date: Mapped[date] = mapped_column(Date, nullable=False)
    requested_lwd: Mapped[date] = mapped_column(Date, nullable=False)
    approved_lwd: Mapped[date] = mapped_column(Date, nullable=False)
    contractual_notice_days: Mapped[int] = mapped_column(Integer, default=60, nullable=False)
    served_notice_days: Mapped[int] = mapped_column(Integer, default=60, nullable=False)
    notice_shortfall_days: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    notice_shortfall_waived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    waiver_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    internal_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(64), default="INITIATED", nullable=False)
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_separations_tenant_status", "tenant_id", "status"),
        Index("idx_separations_emp", "employee_id"),
    )


class HRMSSettlementSheet(Base):
    """Full and final (F&F) mathematical financial settlement."""

    __tablename__ = "hrms_settlement_sheets"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    separation_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("hrms_separations.id", ondelete="CASCADE"), nullable=False)
    final_working_days: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    pro_rata_salary: Mapped[Decimal] = mapped_column(Numeric(18, 4), default=0.00, nullable=False)
    encashed_leave_days: Mapped[Decimal] = mapped_column(Numeric(8, 2), default=0.00, nullable=False)
    leave_encashment_amount: Mapped[Decimal] = mapped_column(Numeric(18, 4), default=0.00, nullable=False)
    is_gratuity_eligible: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    tenure_years: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    gratuity_amount: Mapped[Decimal] = mapped_column(Numeric(18, 4), default=0.00, nullable=False)
    reimbursements_payable: Mapped[Decimal] = mapped_column(Numeric(18, 4), default=0.00, nullable=False)
    notice_shortfall_deduction: Mapped[Decimal] = mapped_column(Numeric(18, 4), default=0.00, nullable=False)
    salary_advance_unrecovered: Mapped[Decimal] = mapped_column(Numeric(18, 4), default=0.00, nullable=False)
    departmental_asset_recoveries: Mapped[Decimal] = mapped_column(Numeric(18, 4), default=0.00, nullable=False)
    final_tds_tax: Mapped[Decimal] = mapped_column(Numeric(18, 4), default=0.00, nullable=False)
    final_professional_tax: Mapped[Decimal] = mapped_column(Numeric(18, 4), default=0.00, nullable=False)
    net_payable_amount: Mapped[Decimal] = mapped_column(Numeric(18, 4), default=0.00, nullable=False)
    gl_journal_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="DRAFT", nullable=False)
    audited_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    audited_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    disbursed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    bank_reference_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("separation_id", name="uq_settlement_sheet_sep"),
    )
