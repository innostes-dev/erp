"""Verify that committed apps/api-server/openapi.json matches the running app's OpenAPI spec.

Usage:
    python scripts/check_openapi.py
"""

import difflib
import json
from pathlib import Path
import sys

app_root = Path(__file__).resolve().parents[1]
if str(app_root) not in sys.path:
    sys.path.insert(0, str(app_root))

from app.main import app  # noqa: E402


def main() -> None:
    spec_path = app_root / "openapi.json"
    if not spec_path.exists():
        print(f"❌ {spec_path} does not exist. Run 'pnpm nx run api-server:openapi'.", file=sys.stderr)
        sys.exit(1)

    committed = spec_path.read_text(encoding="utf-8")
    current = json.dumps(app.openapi(), indent=2, ensure_ascii=False) + "\n"

    if committed != current:
        diff = difflib.unified_diff(
            committed.splitlines(keepends=True),
            current.splitlines(keepends=True),
            fromfile="openapi.json (committed)",
            tofile="openapi.json (generated)",
        )
        sys.stderr.writelines(diff)
        print("\n❌ openapi.json is stale! Run 'pnpm nx run api-server:openapi' and commit the result.", file=sys.stderr)
        sys.exit(1)

    print("✓ apps/api-server/openapi.json is up to date with code.")
    sys.exit(0)


if __name__ == "__main__":
    main()
