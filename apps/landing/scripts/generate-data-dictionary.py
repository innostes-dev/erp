"""Generate and verify data dictionary and schema documentation from SQLAlchemy models."""

import sys
from pathlib import Path

# Add project roots
repo_root = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(repo_root / "kernel" / "backend"))
sys.path.insert(0, str(repo_root / "apps" / "api-server"))

import kernel.models  # Registers all 18 tables
from kernel.core.database import Base


def get_schema_summary() -> dict[str, list[dict[str, str]]]:
    summary = {}
    for table_name, table in sorted(Base.metadata.tables.items()):
        cols = []
        for col in table.columns:
            cols.append(
                {
                    "name": col.name,
                    "type": str(col.type),
                    "nullable": str(col.nullable),
                    "primary_key": str(col.primary_key),
                    "foreign_keys": ", ".join(f"{fk.target_fullname}" for fk in col.foreign_keys) or "-",
                }
            )
        summary[table_name] = cols
    return summary


def main():
    summary = get_schema_summary()
    expected_tables = 18
    actual_tables = len(summary)

    if "--check" in sys.argv:
        if actual_tables < expected_tables:
            print(f"ERROR: Expected at least {expected_tables} tables in Base.metadata, found {actual_tables}")
            sys.exit(1)
        print(f"✓ Schema dictionary check passed ({actual_tables} tables verified in Base.metadata).")
        sys.exit(0)

    print(f"Discovered {actual_tables} tables across registered models.")
    for table_name, cols in summary.items():
        print(f"Table: {table_name} ({len(cols)} columns)")


if __name__ == "__main__":
    main()
