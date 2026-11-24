"""identities and credentials (expand step)

Moves login identifiers (email, phone, ...) and secrets (password, later PIN/TOTP/passkey) out of
`users` into `identities` and `credentials`, and backfills them from the legacy columns. The legacy
columns are kept and still written (expand/contract), so this is backwards compatible.

The SQL lives in `migrations/sql/0010_identities_credentials.sql` and is shared verbatim with the
Laravel and NestJS kernels (check: `node scripts/parity/check-shared-sql.mjs`).

Revision ID: 0010_identities_and_credentials
Revises: 0009_create_hrms_tables
Create Date: 2026-11-25
"""

from pathlib import Path
import re
from typing import Sequence, Union

from alembic import op

revision: str = "0010_identities_and_credentials"
down_revision: Union[str, None] = "0009_create_hrms_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

SQL_FILE = Path(__file__).resolve().parents[1] / "sql" / "0010_identities_credentials.sql"


def _statements(sql: str) -> list[str]:
    """Split the shared SQL file into single statements.

    The async driver (asyncpg) cannot run several statements in one call, so they are executed one by
    one. The file contains no semicolons inside literals; comment lines are dropped before splitting.
    """
    body = "\n".join(line for line in sql.splitlines() if not line.lstrip().startswith("--"))
    return [s.strip() for s in re.split(r";\s*(?:\n|$)", body) if s.strip()]


def upgrade() -> None:
    for statement in _statements(SQL_FILE.read_text(encoding="utf-8")):
        op.execute(statement)


def downgrade() -> None:
    # Safe because the legacy columns on `users` are still the complete copy during the expand step.
    op.execute("DROP TABLE IF EXISTS credentials")
    op.execute("DROP TABLE IF EXISTS identities")
