"""Architectural fitness functions (F1-F4) for kernel backend.

Enforces structural invariants across database models, layering, and service contracts.
"""

import unittest
from kernel.core.database import Base, BaseModel
import kernel.models  # Ensures all tables are imported


class ArchitectureFitnessTestCase(unittest.TestCase):
    """Fitness functions validating kernel architectural rules."""

    def test_all_kernel_tables_inherit_base_model(self):
        """Rule: Every relational table must inherit BaseModel with UUID, audit and soft delete mixins (F1, A4)."""
        tables = Base.metadata.tables
        self.assertGreaterEqual(len(tables), 18, "Expected at least 18 kernel tables")

        required_columns = {
            "id",
            "created_at",
            "created_by",
            "updated_at",
            "updated_by",
            "deleted_at",
            "deleted_by",
        }

        for table_name, table in tables.items():
            col_names = set(table.columns.keys())
            missing = required_columns - col_names
            self.assertEqual(
                missing,
                set(),
                f"Table '{table_name}' violates common column standard (F1). Missing: {missing}",
            )

    def test_uuid_primary_keys(self):
        """Rule: All tables must use UUID primary keys for distributed scalability (ADR-0007)."""
        for table_name, table in Base.metadata.tables.items():
            pk_cols = [c for c in table.columns if c.primary_key]
            self.assertEqual(
                len(pk_cols),
                1,
                f"Table '{table_name}' must have exactly one primary key column",
            )
            self.assertEqual(
                pk_cols[0].name,
                "id",
                f"Table '{table_name}' primary key column must be named 'id'",
            )


if __name__ == "__main__":
    unittest.main()
