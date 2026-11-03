"""create comprehensive hrms tables

Revision ID: 0009_create_hrms_tables
Revises: 0008_enterprise_rbac_and_data_scopes
Create Date: 2026-11-04
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0009_create_hrms_tables"
down_revision: Union[str, None] = "0008_enterprise_rbac_and_data_scopes"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. hrms_departments
    op.create_table(
        "hrms_departments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("code", sa.String(64), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("parent_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_departments.id", ondelete="SET NULL"), nullable=True),
        sa.Column("manager_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("cost_center_code", sa.String(64), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("is_system", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("tenant_id", "code", name="uq_tenant_dept_code"),
    )

    # 2. hrms_designations
    op.create_table(
        "hrms_designations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("code", sa.String(64), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("job_family", sa.String(64), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("is_system", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("tenant_id", "code", name="uq_tenant_desig_code"),
    )

    # 3. hrms_locations
    op.create_table(
        "hrms_locations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("code", sa.String(64), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("physical_address", sa.Text(), nullable=False),
        sa.Column("city", sa.String(100), nullable=False),
        sa.Column("state", sa.String(100), nullable=False),
        sa.Column("country_code", sa.String(2), nullable=False, server_default="IN"),
        sa.Column("timezone", sa.String(64), nullable=False, server_default="Asia/Kolkata"),
        sa.Column("latitude", sa.Numeric(10, 7), nullable=True),
        sa.Column("longitude", sa.Numeric(10, 7), nullable=True),
        sa.Column("geofence_radius_meters", sa.Integer(), nullable=False, server_default="200"),
        sa.Column("ip_whitelist_cidrs", postgresql.ARRAY(sa.Text()), server_default="{}", nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("is_system", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("tenant_id", "code", name="uq_tenant_loc_code"),
    )

    # 4. hrms_holiday_calendars
    op.create_table(
        "hrms_holiday_calendars",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("code", sa.String(64), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("calendar_year", sa.Integer(), nullable=False),
        sa.Column("location_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_locations.id", ondelete="SET NULL"), nullable=True),
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("tenant_id", "code", name="uq_tenant_cal_code"),
    )
    op.create_index("idx_hrms_holiday_cal", "hrms_holiday_calendars", ["tenant_id", "calendar_year", "location_id"])

    # 5. hrms_holidays
    op.create_table(
        "hrms_holidays",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("calendar_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_holiday_calendars.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("holiday_date", sa.Date(), nullable=False),
        sa.Column("holiday_type", sa.String(32), nullable=False, server_default="MANDATORY"),
        sa.Column("is_half_day", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("half_day_period", sa.String(16), server_default="FULL_DAY"),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("observed_substitute_date", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.UniqueConstraint("calendar_id", "holiday_date", name="uq_calendar_holiday_date"),
    )
    op.create_index("idx_hrms_holidays_date", "hrms_holidays", ["tenant_id", "holiday_date"])

    # 6. hrms_picklists
    op.create_table(
        "hrms_picklists",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("category", sa.String(64), nullable=False),
        sa.Column("code", sa.String(64), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("is_system", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("tenant_id", "category", "code", name="uq_tenant_picklist_code"),
    )
    op.create_index("idx_hrms_picklists", "hrms_picklists", ["tenant_id", "category", "is_active", "display_order"])

    # 7. hrms_parties
    op.create_table(
        "hrms_parties",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("salutation", sa.String(16), nullable=True),
        sa.Column("legal_first_name", sa.String(100), nullable=False),
        sa.Column("legal_middle_name", sa.String(100), nullable=True),
        sa.Column("legal_last_name", sa.String(100), nullable=False),
        sa.Column("display_name", sa.String(150), nullable=False),
        sa.Column("date_of_birth", sa.Date(), nullable=False),
        sa.Column("gender", sa.String(32), nullable=False),
        sa.Column("marital_status", sa.String(32), nullable=True),
        sa.Column("marriage_date", sa.Date(), nullable=True),
        sa.Column("blood_group", sa.String(16), nullable=True),
        sa.Column("nationality", sa.String(2), nullable=False, server_default="IN"),
        sa.Column("father_name", sa.String(150), nullable=True),
        sa.Column("mother_name", sa.String(150), nullable=True),
        sa.Column("spouse_name", sa.String(150), nullable=True),
        sa.Column("is_differently_abled", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("disability_details", sa.Text(), nullable=True),
        sa.Column("personal_email", sa.String(255), nullable=False),
        sa.Column("mobile_phone", sa.String(32), nullable=False),
        sa.Column("alternate_phone", sa.String(32), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("idx_hrms_parties_tenant", "hrms_parties", ["tenant_id"])

    # 8. kernel_aadhaar_vault
    op.create_table(
        "kernel_aadhaar_vault",
        sa.Column("reference_key", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("party_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_parties.id", ondelete="CASCADE"), nullable=False),
        sa.Column("aadhaar_ciphertext", postgresql.BYTEA(), nullable=False),
        sa.Column("dek_wrapped", postgresql.BYTEA(), nullable=False),
        sa.Column("kek_version", sa.String(32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # 9. hrms_statutory_identities
    op.create_table(
        "hrms_statutory_identities",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("party_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_parties.id", ondelete="CASCADE"), nullable=False),
        sa.Column("aadhaar_reference_key", postgresql.UUID(as_uuid=True), sa.ForeignKey("kernel_aadhaar_vault.reference_key"), nullable=True),
        sa.Column("aadhaar_masked", sa.String(20), nullable=True),
        sa.Column("aadhaar_virtual_id", sa.String(20), nullable=True),
        sa.Column("pan_number_enc", postgresql.BYTEA(), nullable=True),
        sa.Column("pan_number_masked", sa.String(15), nullable=True),
        sa.Column("pan_search_hash", sa.String(64), nullable=True),
        sa.Column("uan_number", sa.String(12), nullable=True),
        sa.Column("previous_pf_member_id", sa.String(64), nullable=True),
        sa.Column("esic_number", sa.String(17), nullable=True),
        sa.Column("professional_tax_state", sa.String(64), nullable=True),
        sa.Column("lwf_state_code", sa.String(16), nullable=True),
        sa.Column("passport_number_enc", postgresql.BYTEA(), nullable=True),
        sa.Column("passport_expiry_date", sa.Date(), nullable=True),
        sa.Column("passport_place_of_issue", sa.String(100), nullable=True),
        sa.Column("visa_type", sa.String(50), nullable=True),
        sa.Column("visa_number", sa.String(50), nullable=True),
        sa.Column("visa_expiry_date", sa.Date(), nullable=True),
        sa.Column("driving_license_number", sa.String(50), nullable=True),
        sa.Column("voter_id_number", sa.String(50), nullable=True),
        sa.Column("us_ssn_enc", postgresql.BYTEA(), nullable=True),
        sa.Column("us_ssn_masked", sa.String(15), nullable=True),
        sa.Column("uk_nino_enc", postgresql.BYTEA(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.UniqueConstraint("tenant_id", "party_id", name="uq_party_statutory"),
    )
    op.create_index("idx_hrms_statutory_pan_hash", "hrms_statutory_identities", ["tenant_id", "pan_search_hash"])

    # 10. hrms_addresses
    op.create_table(
        "hrms_addresses",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("party_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_parties.id", ondelete="CASCADE"), nullable=False),
        sa.Column("type", sa.String(32), nullable=False),
        sa.Column("address_line1", sa.String(255), nullable=False),
        sa.Column("address_line2", sa.String(255), nullable=True),
        sa.Column("city", sa.String(100), nullable=False),
        sa.Column("district", sa.String(100), nullable=True),
        sa.Column("state", sa.String(100), nullable=False),
        sa.Column("postal_code", sa.String(20), nullable=False),
        sa.Column("country_code", sa.String(2), nullable=False, server_default="IN"),
        sa.Column("residence_type", sa.String(32), nullable=False, server_default="RENTED"),
        sa.Column("is_same_as_current", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("proof_document_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("party_id", "type", name="uq_party_address_type"),
    )

    # 11. hrms_emergency_contacts
    op.create_table(
        "hrms_emergency_contacts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("party_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_parties.id", ondelete="CASCADE"), nullable=False),
        sa.Column("contact_name", sa.String(150), nullable=False),
        sa.Column("relationship", sa.String(64), nullable=False),
        sa.Column("primary_phone", sa.String(32), nullable=False),
        sa.Column("alternate_phone", sa.String(32), nullable=True),
        sa.Column("residential_address", sa.Text(), nullable=True),
        sa.Column("is_primary", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # 12. hrms_bank_accounts
    op.create_table(
        "hrms_bank_accounts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("party_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_parties.id", ondelete="CASCADE"), nullable=False),
        sa.Column("bank_name", sa.String(150), nullable=False),
        sa.Column("branch_name", sa.String(150), nullable=True),
        sa.Column("branch_address", sa.Text(), nullable=True),
        sa.Column("account_number_enc", postgresql.BYTEA(), nullable=False),
        sa.Column("account_number_masked", sa.String(30), nullable=False),
        sa.Column("account_number_search_hash", sa.String(64), nullable=False),
        sa.Column("account_type", sa.String(64), nullable=False, server_default="SALARY_CORPORATE"),
        sa.Column("routing_identifier", sa.String(64), nullable=False),
        sa.Column("routing_identifier_type", sa.String(32), nullable=False, server_default="IFSC"),
        sa.Column("micr_code", sa.String(9), nullable=True),
        sa.Column("account_holder_name", sa.String(150), nullable=False),
        sa.Column("penny_drop_status", sa.String(32), nullable=False, server_default="PENDING"),
        sa.Column("disbursal_mode", sa.String(64), nullable=False, server_default="NEFT"),
        sa.Column("is_primary", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("idx_hrms_bank_hash", "hrms_bank_accounts", ["tenant_id", "account_number_search_hash"])

    # 13. hrms_employees
    op.create_table(
        "hrms_employees",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("party_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_parties.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("employee_code", sa.String(32), nullable=False),
        sa.Column("biometric_badge_id", sa.String(64), nullable=True),
        sa.Column("work_email", sa.String(255), nullable=False),
        sa.Column("legal_entity_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("business_unit", sa.String(64), nullable=True),
        sa.Column("department_code", sa.String(64), nullable=False),
        sa.Column("sub_department", sa.String(64), nullable=True),
        sa.Column("cost_center_code", sa.String(32), nullable=True),
        sa.Column("designation_code", sa.String(64), nullable=False),
        sa.Column("grade_band", sa.String(64), nullable=True),
        sa.Column("manager_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_employees.id", ondelete="SET NULL"), nullable=True),
        sa.Column("dotted_line_manager_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_employees.id", ondelete="SET NULL"), nullable=True),
        sa.Column("hrbp_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_employees.id", ondelete="SET NULL"), nullable=True),
        sa.Column("location_code", sa.String(64), nullable=False, server_default="HQ"),
        sa.Column("work_mode", sa.String(32), nullable=False, server_default="IN_OFFICE"),
        sa.Column("shift_policy_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("holiday_calendar_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_holiday_calendars.id", ondelete="SET NULL"), nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="DRAFT"),
        sa.Column("hire_date", sa.Date(), nullable=False),
        sa.Column("probation_period_days", sa.Integer(), nullable=True),
        sa.Column("probation_end_date", sa.Date(), nullable=True),
        sa.Column("confirmation_date", sa.Date(), nullable=True),
        sa.Column("notice_period_days", sa.Integer(), nullable=False, server_default="30"),
        sa.Column("notice_start_date", sa.Date(), nullable=True),
        sa.Column("termination_date", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("tenant_id", "employee_code", name="uq_tenant_employee_code"),
        sa.UniqueConstraint("tenant_id", "work_email", name="uq_tenant_work_email"),
    )
    op.create_index("idx_hrms_employees_tenant", "hrms_employees", ["tenant_id", "status"])
    op.create_index("idx_hrms_employees_manager", "hrms_employees", ["manager_id"])

    # 14. hrms_contracts
    op.create_table(
        "hrms_contracts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("employee_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_employees.id", ondelete="CASCADE"), nullable=False),
        sa.Column("contract_type", sa.String(64), nullable=False, server_default="PERMANENT_FULL_TIME"),
        sa.Column("base_salary", sa.Numeric(18, 4), nullable=False),
        sa.Column("currency", sa.String(3), nullable=False, server_default="INR"),
        sa.Column("pay_frequency", sa.String(32), nullable=False, server_default="MONTHLY"),
        sa.Column("working_hours_per_week", sa.Numeric(5, 2), nullable=True),
        sa.Column("effective_from", sa.Date(), nullable=False),
        sa.Column("effective_to", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # 15. hrms_education
    op.create_table(
        "hrms_education",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("party_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_parties.id", ondelete="CASCADE"), nullable=False),
        sa.Column("qualification_level", sa.String(64), nullable=False),
        sa.Column("degree_name", sa.String(150), nullable=False),
        sa.Column("field_of_study", sa.String(150), nullable=False),
        sa.Column("institution_name", sa.String(200), nullable=False),
        sa.Column("board_or_university", sa.String(200), nullable=False),
        sa.Column("start_year", sa.Integer(), nullable=False),
        sa.Column("passing_year", sa.Integer(), nullable=False),
        sa.Column("scoring_format", sa.String(32), nullable=False, server_default="PERCENTAGE"),
        sa.Column("score_value", sa.String(32), nullable=False),
        sa.Column("certificate_document_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # 16. hrms_previous_employments
    op.create_table(
        "hrms_previous_employments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("party_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_parties.id", ondelete="CASCADE"), nullable=False),
        sa.Column("company_name", sa.String(200), nullable=False),
        sa.Column("designation", sa.String(150), nullable=False),
        sa.Column("department", sa.String(100), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("last_drawn_annual_ctc", sa.Numeric(15, 2), nullable=True),
        sa.Column("company_website", sa.String(255), nullable=True),
        sa.Column("reporting_manager_name", sa.String(150), nullable=True),
        sa.Column("reporting_manager_email", sa.String(255), nullable=True),
        sa.Column("reporting_manager_contact", sa.String(100), nullable=True),
        sa.Column("hr_contact_email", sa.String(255), nullable=True),
        sa.Column("reason_for_leaving", sa.Text(), nullable=True),
        sa.Column("previous_pf_member_id", sa.String(50), nullable=True),
        sa.Column("has_relieving_letter", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("relieving_letter_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("payslips_doc_ids", postgresql.ARRAY(postgresql.UUID(as_uuid=True)), server_default="{}", nullable=True),
        sa.Column("form_16_doc_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # 17. hrms_skills
    op.create_table(
        "hrms_skills",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("code", sa.String(64), nullable=False),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("category", sa.String(64), nullable=False, server_default="TECHNICAL"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.UniqueConstraint("tenant_id", "code", name="uq_tenant_skill"),
    )

    # 18. hrms_employee_skills
    op.create_table(
        "hrms_employee_skills",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("party_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_parties.id", ondelete="CASCADE"), nullable=False),
        sa.Column("skill_code", sa.String(64), nullable=False),
        sa.Column("proficiency_level", sa.String(32), nullable=False, server_default="INTERMEDIATE"),
        sa.Column("years_of_experience", sa.Numeric(4, 1), nullable=False, server_default="0.0"),
        sa.Column("is_primary", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("tenant_id", "party_id", "skill_code", name="uq_party_skill"),
    )

    # 19. hrms_certifications
    op.create_table(
        "hrms_certifications",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("party_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_parties.id", ondelete="CASCADE"), nullable=False),
        sa.Column("certification_name", sa.String(200), nullable=False),
        sa.Column("issuing_authority", sa.String(200), nullable=False),
        sa.Column("license_number", sa.String(100), nullable=True),
        sa.Column("issue_date", sa.Date(), nullable=False),
        sa.Column("expiry_date", sa.Date(), nullable=True),
        sa.Column("never_expires", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("verification_url", sa.String(512), nullable=True),
        sa.Column("certificate_doc_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # 20. hrms_onboarding_preferences
    op.create_table(
        "hrms_onboarding_preferences",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("employee_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_employees.id", ondelete="CASCADE"), nullable=False),
        sa.Column("laptop_preference", sa.String(64), nullable=False, server_default="MACOS_PRO"),
        sa.Column("tshirt_size", sa.String(16), nullable=False, server_default="L"),
        sa.Column("dietary_preference", sa.String(64), nullable=False, server_default="NON_VEGETARIAN"),
        sa.Column("ergonomic_accommodations", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("tenant_id", "employee_id", name="uq_emp_preferences"),
    )

    # 21. hrms_dependents_nominees
    op.create_table(
        "hrms_dependents_nominees",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("party_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_parties.id", ondelete="CASCADE"), nullable=False),
        sa.Column("full_name", sa.String(150), nullable=False),
        sa.Column("relationship", sa.String(64), nullable=False),
        sa.Column("date_of_birth", sa.Date(), nullable=False),
        sa.Column("is_minor", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("guardian_name", sa.String(150), nullable=True),
        sa.Column("guardian_relationship", sa.String(64), nullable=True),
        sa.Column("residential_address", sa.Text(), nullable=True),
        sa.Column("pf_nomination_percent", sa.Numeric(5, 2), nullable=False, server_default="0.00"),
        sa.Column("eps_nomination_percent", sa.Numeric(5, 2), nullable=False, server_default="0.00"),
        sa.Column("gratuity_nomination_percent", sa.Numeric(5, 2), nullable=False, server_default="0.00"),
        sa.Column("gtli_nomination_percent", sa.Numeric(5, 2), nullable=False, server_default="0.00"),
        sa.Column("is_covered_under_mediclaim", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("pre_existing_conditions", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # 22. hrms_document_vault
    op.create_table(
        "hrms_document_vault",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("party_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_parties.id", ondelete="CASCADE"), nullable=False),
        sa.Column("category", sa.String(64), nullable=False),
        sa.Column("document_type", sa.String(100), nullable=False),
        sa.Column("file_name", sa.String(255), nullable=False),
        sa.Column("file_size_bytes", sa.BigInteger(), nullable=False),
        sa.Column("mime_type", sa.String(100), nullable=False),
        sa.Column("sha256_checksum", sa.String(64), nullable=False),
        sa.Column("storage_uri", sa.String(512), nullable=False),
        sa.Column("verification_status", sa.String(32), nullable=False, server_default="PENDING_UPLOAD"),
        sa.Column("verified_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_employees.id", ondelete="SET NULL"), nullable=True),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("idx_hrms_doc_party", "hrms_document_vault", ["tenant_id", "party_id", "category"])

    # 23. hrms_profile_field_policies
    op.create_table(
        "hrms_profile_field_policies",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("section_code", sa.String(64), nullable=False),
        sa.Column("field_name", sa.String(64), nullable=False, server_default="*"),
        sa.Column("is_employee_editable", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("approval_mode", sa.String(32), nullable=False, server_default="MANUAL_APPROVE"),
        sa.Column("requires_attachment", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.UniqueConstraint("tenant_id", "section_code", "field_name", name="uq_tenant_section_field"),
    )

    # 24. hrms_profile_change_requests
    op.create_table(
        "hrms_profile_change_requests",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("employee_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_employees.id", ondelete="CASCADE"), nullable=False),
        sa.Column("section_code", sa.String(64), nullable=False),
        sa.Column("field_name", sa.String(64), nullable=False, server_default="*"),
        sa.Column("old_value", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("new_value", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("supporting_document_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="PENDING"),
        sa.Column("requested_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("reviewed_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_employees.id", ondelete="SET NULL"), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column("effective_date", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("idx_hrms_change_req_status", "hrms_profile_change_requests", ["tenant_id", "status"])
    op.create_index("idx_hrms_change_req_emp", "hrms_profile_change_requests", ["tenant_id", "employee_id"])

    # 25. hrms_onboarding_steppers
    op.create_table(
        "hrms_onboarding_steppers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("employee_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_employees.id", ondelete="CASCADE"), nullable=False),
        sa.Column("current_step", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("step_1_completed", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("step_2_completed", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("step_3_completed", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("step_4_completed", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("step_5_completed", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("step_6_completed", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("step_7_completed", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("step_8_completed", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("step_9_completed", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("step_10_completed", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("is_submitted", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("is_hr_approved", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("is_sealed", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("reviewed_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_employees.id", ondelete="SET NULL"), nullable=True),
        sa.Column("review_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.UniqueConstraint("tenant_id", "employee_id", name="uq_emp_stepper"),
    )

    # 26. hrms_onboarding_drafts
    op.create_table(
        "hrms_onboarding_drafts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("employee_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_employees.id", ondelete="CASCADE"), nullable=False),
        sa.Column("step_number", sa.Integer(), nullable=False),
        sa.Column("draft_payload", postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=False),
        sa.Column("client_version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("last_saved_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("tenant_id", "employee_id", "step_number", name="uq_emp_step_draft"),
    )
    op.create_index("idx_hrms_onboarding_drafts", "hrms_onboarding_drafts", ["tenant_id", "employee_id", "step_number"])

    # 27. hrms_attendance_punches
    op.create_table(
        "hrms_attendance_punches",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("employee_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_employees.id", ondelete="CASCADE"), nullable=False),
        sa.Column("punch_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("direction", sa.String(16), nullable=False),
        sa.Column("source", sa.String(64), nullable=False, server_default="web"),
        sa.Column("location_geo", postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=True),
        sa.Column("is_manual_override", sa.Boolean(), server_default=sa.text("false"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("idx_hrms_punches_emp_time", "hrms_attendance_punches", ["tenant_id", "employee_id", "punch_time"])

    # 28. hrms_attendance_blocks
    op.create_table(
        "hrms_attendance_blocks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("employee_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_employees.id", ondelete="CASCADE"), nullable=False),
        sa.Column("work_date", sa.Date(), nullable=False),
        sa.Column("in_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("out_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("total_duration_minutes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("late_minutes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("overtime_minutes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("work_location", sa.String(32), nullable=False, server_default="office"),
        sa.Column("status", sa.String(32), nullable=False, server_default="NORMAL"),
        sa.UniqueConstraint("tenant_id", "employee_id", "work_date", "in_time", name="uq_emp_date_in"),
    )
    op.create_index("idx_hrms_attendance_date", "hrms_attendance_blocks", ["tenant_id", "work_date"])

    # 29. hrms_monthly_timesheets
    op.create_table(
        "hrms_monthly_timesheets",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("employee_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_employees.id", ondelete="CASCADE"), nullable=False),
        sa.Column("manager_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_employees.id", ondelete="SET NULL"), nullable=True),
        sa.Column("period_month", sa.String(7), nullable=False),
        sa.Column("total_present_days", sa.Numeric(4, 1), nullable=False, server_default="0.0"),
        sa.Column("total_absent_days", sa.Numeric(4, 1), nullable=False, server_default="0.0"),
        sa.Column("total_leave_days", sa.Numeric(4, 1), nullable=False, server_default="0.0"),
        sa.Column("total_worked_hours", sa.Numeric(6, 2), nullable=False, server_default="0.0"),
        sa.Column("status", sa.String(32), nullable=False, server_default="DRAFT"),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("approved_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_employees.id", ondelete="SET NULL"), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("rejection_comment", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.UniqueConstraint("tenant_id", "employee_id", "period_month", name="uq_emp_monthly_timesheet"),
    )
    op.create_index("idx_hrms_timesheet_mgr", "hrms_monthly_timesheets", ["tenant_id", "manager_id", "status"])

    # 30. hrms_leave_types
    op.create_table(
        "hrms_leave_types",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("code", sa.String(32), nullable=False),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("color_hex", sa.String(7), nullable=False, server_default="#3B82F6"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("is_system", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("is_unlimited", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("annual_quota", sa.Numeric(5, 2), nullable=False, server_default="12.00"),
        sa.Column("accrual_frequency", sa.String(32), nullable=False, server_default="ANNUAL_LUMP_SUM"),
        sa.Column("accrual_timing", sa.String(32), nullable=False, server_default="BEGINNING_OF_PERIOD"),
        sa.Column("proration_rule", sa.String(32), nullable=False, server_default="EXACT_DAYS"),
        sa.Column("can_carry_forward", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("carry_forward_cap", sa.Numeric(5, 2), nullable=False, server_default="0.00"),
        sa.Column("carry_forward_expiry_months", sa.Integer(), nullable=True),
        sa.Column("is_encashable", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("encashment_mode", sa.String(32), nullable=False, server_default="UPON_SEPARATION_ONLY"),
        sa.Column("encashment_salary_basis", sa.String(32), nullable=False, server_default="BASIC_SALARY"),
        sa.Column("encashment_min_balance_retained", sa.Numeric(5, 2), nullable=False, server_default="0.00"),
        sa.Column("encashment_max_days_per_year", sa.Numeric(5, 2), nullable=False, server_default="0.00"),
        sa.Column("allow_half_day", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("min_notice_days", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("max_consecutive_days", sa.Integer(), nullable=True),
        sa.Column("allow_past_dating", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("max_past_days", sa.Integer(), nullable=False, server_default="3"),
        sa.Column("allow_negative_balance", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("max_negative_days", sa.Numeric(4, 2), nullable=False, server_default="0.00"),
        sa.Column("requires_attachment", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("attachment_mandatory_above_days", sa.Integer(), nullable=True),
        sa.Column("include_weekends", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("include_holidays", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("sandwich_rule_mode", sa.String(32), nullable=False, server_default="DISABLED"),
        sa.Column("probation_rule", sa.String(32), nullable=False, server_default="FULL_ACCESS"),
        sa.Column("notice_period_rule", sa.String(32), nullable=False, server_default="MANAGER_DISCRETION"),
        sa.Column("applicable_gender", sa.String(32), nullable=False, server_default="ALL"),
        sa.Column("applicable_employment_types", postgresql.ARRAY(sa.String(64)), server_default="{PERMANENT_FULL_TIME,PERMANENT_PART_TIME}", nullable=True),
        sa.Column("approval_workflow", sa.String(32), nullable=False, server_default="SINGLE_LEVEL_MANAGER"),
        sa.Column("auto_approve_if_below_days", sa.Numeric(3, 1), nullable=True),
        sa.Column("sla_hours", sa.Integer(), nullable=False, server_default="48"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.UniqueConstraint("tenant_id", "code", name="uq_tenant_leave_code"),
    )

    # 31. hrms_leave_applications
    op.create_table(
        "hrms_leave_applications",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("employee_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_employees.id", ondelete="CASCADE"), nullable=False),
        sa.Column("leave_type_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_leave_types.id"), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("start_half", sa.String(16), nullable=False, server_default="FULL_DAY"),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("end_half", sa.String(16), nullable=False, server_default="FULL_DAY"),
        sa.Column("base_days", sa.Numeric(5, 2), nullable=False),
        sa.Column("sandwich_days", sa.Numeric(5, 2), nullable=False, server_default="0.00"),
        sa.Column("total_days", sa.Numeric(5, 2), nullable=False),
        sa.Column("status", sa.String(32), nullable=False, server_default="PENDING"),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("supporting_document_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("manager_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_employees.id", ondelete="SET NULL"), nullable=True),
        sa.Column("skip_level_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_employees.id", ondelete="SET NULL"), nullable=True),
        sa.Column("approved_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_employees.id", ondelete="SET NULL"), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("idx_hrms_leave_app_emp", "hrms_leave_applications", ["tenant_id", "employee_id", "status"])

    # 32. hrms_leave_ledger
    op.create_table(
        "hrms_leave_ledger",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("employee_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_employees.id", ondelete="CASCADE"), nullable=False),
        sa.Column("leave_type_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_leave_types.id"), nullable=False),
        sa.Column("transaction_date", sa.Date(), nullable=False),
        sa.Column("action", sa.String(32), nullable=False),
        sa.Column("days", sa.Numeric(5, 2), nullable=False),
        sa.Column("reference_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("remarks", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("idx_leave_ledger_balance", "hrms_leave_ledger", ["tenant_id", "employee_id", "leave_type_id"])

    # 33. hrms_payroll_settings
    op.create_table(
        "hrms_payroll_settings",
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("pay_frequency", sa.String(32), nullable=False, server_default="MONTHLY"),
        sa.Column("cycle_start_day", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("payout_day", sa.String(32), nullable=False, server_default="LAST_DAY_OF_MONTH"),
        sa.Column("lop_calculation_method", sa.String(32), nullable=False, server_default="CALENDAR_DAYS"),
        sa.Column("enable_epf", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("epf_calculation_mode", sa.String(32), nullable=False, server_default="STATUTORY_CEILING_15K"),
        sa.Column("epf_establishment_code", sa.String(64), nullable=True),
        sa.Column("enable_esic", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("esic_establishment_code", sa.String(64), nullable=True),
        sa.Column("enable_professional_tax", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("enable_lwf", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("enable_gratuity", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("default_tax_regime", sa.String(32), nullable=False, server_default="SECTION_115BAC_NEW"),
        sa.Column("allow_midyear_regime_switch", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("tax_declaration_window_end_day", sa.Integer(), nullable=False, server_default="30"),
        sa.Column("bank_cms_format", sa.String(64), nullable=False, server_default="HDFC_CMS"),
        sa.Column("corporate_bank_account_number", sa.String(64), nullable=True),
        sa.Column("corporate_bank_ifsc", sa.String(32), nullable=True),
        sa.Column("gl_salary_expense_account_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("gl_salaries_payable_account_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("gl_tax_payable_account_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("auto_post_gl_journal", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("auto_dispatch_payslip_emails", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("payslip_password_formula", sa.String(64), nullable=False, server_default="NAME4_DOB_DDMM"),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )

    # 34. hrms_salary_components
    op.create_table(
        "hrms_salary_components",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("code", sa.String(32), nullable=False),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("classification", sa.String(64), nullable=False),
        sa.Column("calculation_mode", sa.String(32), nullable=False, server_default="FLAT_AMOUNT"),
        sa.Column("percentage_base", sa.String(64), nullable=True),
        sa.Column("percentage_value", sa.Numeric(7, 4), nullable=True),
        sa.Column("formula_expression", sa.Text(), nullable=True),
        sa.Column("is_lop_prorated", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("is_taxable", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("tax_exemption_code", sa.String(64), nullable=True),
        sa.Column("part_of_ctc", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("show_on_payslip", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("hide_if_zero", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("depends_on", postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'[]'::jsonb"), nullable=True),
        sa.UniqueConstraint("tenant_id", "code", name="uq_tenant_salary_comp"),
    )

    # 35. hrms_salary_structures
    op.create_table(
        "hrms_salary_structures",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("code", sa.String(64), nullable=False),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("rounding_rule", sa.String(32), nullable=False, server_default="NEAREST_INTEGER"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("tenant_id", "code", name="uq_tenant_structure_code"),
    )

    # 36. hrms_salary_structure_components
    op.create_table(
        "hrms_salary_structure_components",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("structure_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_salary_structures.id", ondelete="CASCADE"), nullable=False),
        sa.Column("component_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_salary_components.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("sequence_order", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("calculation_mode_override", sa.String(32), nullable=True),
        sa.Column("percentage_base_override", sa.String(64), nullable=True),
        sa.Column("percentage_value_override", sa.Numeric(7, 4), nullable=True),
        sa.Column("formula_expression_override", sa.Text(), nullable=True),
        sa.Column("fixed_amount_override", sa.Numeric(18, 4), nullable=True),
        sa.UniqueConstraint("structure_id", "component_id", name="uq_structure_component"),
    )
    op.create_index("idx_struct_comp_eval", "hrms_salary_structure_components", ["structure_id", "sequence_order"])

    # 37. hrms_employee_salary_assignments
    op.create_table(
        "hrms_employee_salary_assignments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("employee_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_employees.id", ondelete="CASCADE"), nullable=False),
        sa.Column("structure_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_salary_structures.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("annual_ctc", sa.Numeric(18, 4), nullable=False),
        sa.Column("monthly_base_salary", sa.Numeric(18, 4), nullable=False),
        sa.Column("effective_from", sa.Date(), nullable=False),
        sa.Column("effective_to", sa.Date(), nullable=True),
        sa.Column("custom_component_overrides", postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("idx_emp_salary_assign", "hrms_employee_salary_assignments", ["tenant_id", "employee_id", "effective_from"])

    # 38. hrms_payslip_templates
    op.create_table(
        "hrms_payslip_templates",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("template_name", sa.String(128), nullable=False),
        sa.Column("theme", sa.String(32), nullable=False, server_default="MODERN_MINIMAL"),
        sa.Column("brand_color_hex", sa.String(16), nullable=False, server_default="#2563EB"),
        sa.Column("logo_position", sa.String(16), nullable=False, server_default="LEFT"),
        sa.Column("show_leave_balances", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("show_employer_retirals", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("show_ytd_summary", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("show_amount_in_words", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("show_qr_verification", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("show_digital_signature", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("digital_signature_url", sa.Text(), nullable=True),
        sa.Column("visible_demographic_fields", postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text(''''["EMPLOYEE_ID", "NAME", "DESIGNATION", "DEPARTMENT", "JOINING_DATE", "BANK_ACCOUNT_MASKED", "IFSC", "PAN_MASKED", "UAN", "CALENDAR_DAYS", "LOP_DAYS", "PAID_DAYS"]'::jsonb'''), nullable=False),
        sa.Column("password_formula", sa.String(64), nullable=False, server_default="NAME4_DOB_DDMM"),
        sa.Column("custom_footer_note", sa.Text(), server_default="This is a computer-generated payslip and requires no physical signature.", nullable=True),
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # 39. hrms_payroll_runs
    op.create_table(
        "hrms_payroll_runs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("period_start", sa.Date(), nullable=False),
        sa.Column("period_end", sa.Date(), nullable=False),
        sa.Column("stage", sa.String(32), nullable=False, server_default="DRAFT"),
        sa.Column("total_gross_pay", sa.Numeric(18, 4), nullable=False, server_default="0.0000"),
        sa.Column("total_net_pay", sa.Numeric(18, 4), nullable=False, server_default="0.0000"),
        sa.Column("total_tax_withheld", sa.Numeric(18, 4), nullable=False, server_default="0.0000"),
        sa.Column("processed_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("committed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("gl_journal_id", postgresql.UUID(as_uuid=True), nullable=True),
    )

    # 40. hrms_payslips
    op.create_table(
        "hrms_payslips",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("payroll_run_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_payroll_runs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("employee_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_employees.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("payslip_template_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_payslip_templates.id", ondelete="SET NULL"), nullable=True),
        sa.Column("working_days", sa.Integer(), nullable=False, server_default="30"),
        sa.Column("loss_of_pay_days", sa.Numeric(5, 2), nullable=False, server_default="0.00"),
        sa.Column("gross_pay", sa.Numeric(18, 4), nullable=False),
        sa.Column("total_deductions", sa.Numeric(18, 4), nullable=False),
        sa.Column("net_pay", sa.Numeric(18, 4), nullable=False),
        sa.Column("net_pay_in_words", sa.Text(), nullable=False),
        sa.Column("leave_balances_snapshot", postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=True),
        sa.Column("employer_retirals_snapshot", postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=True),
        sa.Column("ytd_totals_snapshot", postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=True),
        sa.Column("pdf_storage_path", sa.Text(), nullable=True),
        sa.Column("verification_hash", sa.String(128), nullable=True),
        sa.UniqueConstraint("payroll_run_id", "employee_id", name="uq_run_emp"),
    )

    # 41. hrms_payslip_components
    op.create_table(
        "hrms_payslip_components",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("payslip_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_payslips.id", ondelete="CASCADE"), nullable=False),
        sa.Column("component_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_salary_components.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("amount", sa.Numeric(18, 4), nullable=False),
        sa.Column("component_type", sa.String(64), nullable=False),
    )
    op.create_index("idx_payslip_components_lookup", "hrms_payslip_components", ["payslip_id", "component_type"])

    # 42. hrms_tax_declarations
    op.create_table(
        "hrms_tax_declarations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("employee_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_employees.id", ondelete="CASCADE"), nullable=False),
        sa.Column("financial_year", sa.String(16), nullable=False),
        sa.Column("regime", sa.String(32), nullable=False, server_default="SECTION_115BAC_NEW"),
        sa.Column("is_regime_locked", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("regime_locked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("regime_unlocked_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("regime_unlock_reason", sa.Text(), nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="SUBMITTED"),
        sa.Column("total_declared_deductions", sa.Numeric(18, 4), nullable=False, server_default="0.0000"),
        sa.Column("total_verified_deductions", sa.Numeric(18, 4), nullable=False, server_default="0.0000"),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("verified_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.UniqueConstraint("tenant_id", "employee_id", "financial_year", name="uq_emp_fy_declaration"),
    )

    # 43. hrms_tax_declaration_items
    op.create_table(
        "hrms_tax_declaration_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("declaration_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_tax_declarations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("section_code", sa.String(32), nullable=False),
        sa.Column("sub_category", sa.String(64), nullable=False),
        sa.Column("declared_amount", sa.Numeric(18, 4), nullable=False, server_default="0.0000"),
        sa.Column("verified_amount", sa.Numeric(18, 4), nullable=False, server_default="0.0000"),
        sa.Column("landlord_or_lender_name", sa.String(128), nullable=True),
        sa.Column("landlord_or_lender_pan", sa.String(32), nullable=True),
        sa.Column("landlord_or_lender_address", sa.Text(), nullable=True),
        sa.Column("proof_document_url", sa.Text(), nullable=True),
        sa.Column("verification_status", sa.String(32), nullable=False, server_default="PENDING"),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("idx_tax_items_lookup", "hrms_tax_declaration_items", ["declaration_id", "section_code"])

    # 44. hrms_form16_records
    op.create_table(
        "hrms_form16_records",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("employee_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_employees.id", ondelete="CASCADE"), nullable=False),
        sa.Column("financial_year", sa.String(16), nullable=False),
        sa.Column("part_a_traces_file_url", sa.Text(), nullable=True),
        sa.Column("part_b_data", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("merged_signed_pdf_url", sa.Text(), nullable=True),
        sa.Column("digital_signature_cert_serial", sa.String(128), nullable=True),
        sa.Column("traces_token_number", sa.String(64), nullable=True),
        sa.Column("generated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("dispatched_to_employee_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("tenant_id", "employee_id", "financial_year", name="uq_emp_fy_form16"),
    )

    # 45. hrms_approval_delegations
    op.create_table(
        "hrms_approval_delegations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("delegator_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_employees.id", ondelete="CASCADE"), nullable=False),
        sa.Column("delegatee_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_employees.id", ondelete="CASCADE"), nullable=False),
        sa.Column("proxy_type", sa.String(32), nullable=False, server_default="SKIP_LEVEL_MANAGER"),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("scope", sa.String(64), nullable=False, server_default="ALL"),
        sa.Column("notify_delegator_summary", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("idx_delegation_active", "hrms_approval_delegations", ["tenant_id", "delegator_id", "is_active", "start_date", "end_date"])

    # 46. hrms_expense_categories
    op.create_table(
        "hrms_expense_categories",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("code", sa.String(64), nullable=False),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("max_limit_per_claim", sa.Numeric(18, 4), nullable=True),
        sa.Column("is_receipt_mandatory", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("receipt_threshold_amount", sa.Numeric(18, 4), nullable=False, server_default="500.0000"),
        sa.Column("max_claim_age_days", sa.Integer(), nullable=False, server_default="60"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("is_tax_deductible_itc", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("tenant_id", "code", name="uq_tenant_exp_cat"),
    )

    # 47. hrms_workflow_definitions
    op.create_table(
        "hrms_workflow_definitions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("entity_type", sa.String(64), nullable=False),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("tenant_id", "entity_type", "name", name="uq_tenant_workflow"),
    )

    # 48. hrms_workflow_rules
    op.create_table(
        "hrms_workflow_rules",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("workflow_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_workflow_definitions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("rule_name", sa.String(128), nullable=False),
        sa.Column("priority_order", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("condition_expression", postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=False),
        sa.Column("sla_hours", sa.Integer(), nullable=False, server_default="48"),
        sa.Column("on_sla_timeout", sa.String(32), nullable=False, server_default="ESCALATE_TO_SKIP_LEVEL"),
    )

    # 49. hrms_workflow_rule_steps
    op.create_table(
        "hrms_workflow_rule_steps",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("rule_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_workflow_rules.id", ondelete="CASCADE"), nullable=False),
        sa.Column("step_number", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("approver_type", sa.String(32), nullable=False),
        sa.Column("target_role", sa.String(64), nullable=True),
        sa.Column("target_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_employees.id", ondelete="SET NULL"), nullable=True),
    )

    # 50. hrms_expense_claim_reports
    op.create_table(
        "hrms_expense_claim_reports",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("employee_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_employees.id", ondelete="CASCADE"), nullable=False),
        sa.Column("claim_number", sa.String(64), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("business_purpose", sa.Text(), nullable=False),
        sa.Column("cost_center", sa.String(64), nullable=True),
        sa.Column("total_amount", sa.Numeric(18, 4), nullable=False, server_default="0.0000"),
        sa.Column("total_tax_amount", sa.Numeric(18, 4), nullable=False, server_default="0.0000"),
        sa.Column("status", sa.String(32), nullable=False, server_default="DRAFT"),
        sa.Column("current_workflow_step", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("settlement_destination", sa.String(32), nullable=False, server_default="NEXT_PAYROLL"),
        sa.Column("payroll_run_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_payroll_runs.id", ondelete="SET NULL"), nullable=True),
        sa.Column("bank_disbursement_reference", sa.String(128), nullable=True),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("settled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("tenant_id", "claim_number", name="uq_tenant_claim_no"),
    )

    # 51. hrms_expense_line_items
    op.create_table(
        "hrms_expense_line_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("claim_report_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_expense_claim_reports.id", ondelete="CASCADE"), nullable=False),
        sa.Column("category_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_expense_categories.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("expense_date", sa.Date(), nullable=False),
        sa.Column("merchant_name", sa.String(128), nullable=False),
        sa.Column("merchant_gstin", sa.String(32), nullable=True),
        sa.Column("amount", sa.Numeric(18, 4), nullable=False),
        sa.Column("tax_amount", sa.Numeric(18, 4), nullable=False, server_default="0.0000"),
        sa.Column("is_client_billable", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("receipt_file_url", sa.Text(), nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="PENDING"),
    )
    op.create_index("idx_exp_line_items", "hrms_expense_line_items", ["claim_report_id"])

    # 52. hrms_separations
    op.create_table(
        "hrms_separations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("employee_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_employees.id", ondelete="CASCADE"), nullable=False),
        sa.Column("exit_type", sa.String(64), nullable=False, server_default="VOLUNTARY_RESIGNATION"),
        sa.Column("separation_mode", sa.String(32), nullable=False, server_default="ENTERPRISE"),
        sa.Column("resignation_date", sa.Date(), nullable=False),
        sa.Column("requested_lwd", sa.Date(), nullable=False),
        sa.Column("approved_lwd", sa.Date(), nullable=False),
        sa.Column("contractual_notice_days", sa.Integer(), nullable=False, server_default="60"),
        sa.Column("served_notice_days", sa.Integer(), nullable=False, server_default="60"),
        sa.Column("notice_shortfall_days", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("notice_shortfall_waived", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("waiver_reason", sa.Text(), nullable=True),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("internal_notes", sa.Text(), nullable=True),
        sa.Column("status", sa.String(64), nullable=False, server_default="INITIATED"),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    op.create_index("idx_separations_tenant_status", "hrms_separations", ["tenant_id", "status"])
    op.create_index("idx_separations_emp", "hrms_separations", ["employee_id"])

    # 53. hrms_separation_clearance_tasks
    op.create_table(
        "hrms_separation_clearance_tasks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("separation_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_separations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("department", sa.String(64), nullable=False),
        sa.Column("task_code", sa.String(64), nullable=False),
        sa.Column("task_name", sa.String(255), nullable=False),
        sa.Column("assigned_to_role", sa.String(64), nullable=False),
        sa.Column("status", sa.String(32), nullable=False, server_default="PENDING"),
        sa.Column("cleared_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("cleared_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("financial_recovery_amount", sa.Numeric(18, 4), nullable=False, server_default="0.00"),
        sa.Column("recovery_remarks", sa.Text(), nullable=True),
        sa.Column("remarks", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("idx_clearance_tasks_sep", "hrms_separation_clearance_tasks", ["separation_id", "department"])

    # 54. hrms_settlement_sheets
    op.create_table(
        "hrms_settlement_sheets",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("separation_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_separations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("final_working_days", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("pro_rata_salary", sa.Numeric(18, 4), nullable=False, server_default="0.00"),
        sa.Column("encashed_leave_days", sa.Numeric(8, 2), nullable=False, server_default="0.00"),
        sa.Column("leave_encashment_amount", sa.Numeric(18, 4), nullable=False, server_default="0.00"),
        sa.Column("is_gratuity_eligible", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("tenure_years", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("gratuity_amount", sa.Numeric(18, 4), nullable=False, server_default="0.00"),
        sa.Column("reimbursements_payable", sa.Numeric(18, 4), nullable=False, server_default="0.00"),
        sa.Column("notice_shortfall_deduction", sa.Numeric(18, 4), nullable=False, server_default="0.00"),
        sa.Column("salary_advance_unrecovered", sa.Numeric(18, 4), nullable=False, server_default="0.00"),
        sa.Column("departmental_asset_recoveries", sa.Numeric(18, 4), nullable=False, server_default="0.00"),
        sa.Column("final_tds_tax", sa.Numeric(18, 4), nullable=False, server_default="0.00"),
        sa.Column("final_professional_tax", sa.Numeric(18, 4), nullable=False, server_default="0.00"),
        sa.Column("net_payable_amount", sa.Numeric(18, 4), nullable=False, server_default="0.00"),
        sa.Column("gl_journal_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="DRAFT"),
        sa.Column("audited_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("audited_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("disbursed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("bank_reference_id", sa.String(128), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("separation_id", name="uq_settlement_sheet_sep"),
    )

    # 55. hrms_exit_documents
    op.create_table(
        "hrms_exit_documents",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("separation_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_separations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("employee_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hrms_employees.id", ondelete="CASCADE"), nullable=False),
        sa.Column("doc_type", sa.String(64), nullable=False),
        sa.Column("document_title", sa.String(255), nullable=False),
        sa.Column("file_storage_path", sa.Text(), nullable=False),
        sa.Column("file_size_bytes", sa.BigInteger(), nullable=False),
        sa.Column("sha256_hash", sa.String(64), nullable=False),
        sa.Column("is_dsc_signed", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("dsc_signed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("dsc_signer_dn", sa.String(255), nullable=True),
        sa.Column("alumni_visible", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("alumni_accessible_until", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("idx_exit_docs_emp", "hrms_exit_documents", ["employee_id", "doc_type"])


def downgrade() -> None:
    tables = [
        "hrms_exit_documents",
        "hrms_settlement_sheets",
        "hrms_separation_clearance_tasks",
        "hrms_separations",
        "hrms_expense_line_items",
        "hrms_expense_claim_reports",
        "hrms_workflow_rule_steps",
        "hrms_workflow_rules",
        "hrms_workflow_definitions",
        "hrms_expense_categories",
        "hrms_approval_delegations",
        "hrms_form16_records",
        "hrms_tax_declaration_items",
        "hrms_tax_declarations",
        "hrms_payslip_components",
        "hrms_payslips",
        "hrms_payroll_runs",
        "hrms_payslip_templates",
        "hrms_employee_salary_assignments",
        "hrms_salary_structure_components",
        "hrms_salary_structures",
        "hrms_salary_components",
        "hrms_payroll_settings",
        "hrms_leave_ledger",
        "hrms_leave_applications",
        "hrms_leave_types",
        "hrms_monthly_timesheets",
        "hrms_attendance_blocks",
        "hrms_attendance_punches",
        "hrms_onboarding_drafts",
        "hrms_onboarding_steppers",
        "hrms_profile_change_requests",
        "hrms_profile_field_policies",
        "hrms_document_vault",
        "hrms_dependents_nominees",
        "hrms_onboarding_preferences",
        "hrms_certifications",
        "hrms_employee_skills",
        "hrms_skills",
        "hrms_previous_employments",
        "hrms_education",
        "hrms_contracts",
        "hrms_employees",
        "hrms_bank_accounts",
        "hrms_emergency_contacts",
        "hrms_addresses",
        "hrms_statutory_identities",
        "kernel_aadhaar_vault",
        "hrms_parties",
        "hrms_picklists",
        "hrms_holidays",
        "hrms_holiday_calendars",
        "hrms_locations",
        "hrms_designations",
        "hrms_departments",
    ]
    for table in tables:
        op.drop_table(table)
