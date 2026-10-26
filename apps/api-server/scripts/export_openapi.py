"""Write the API's OpenAPI spec to a JSON file (no server or database needed).

Usage:
    python scripts/export_openapi.py [output_path]

Default output: apps/api-server/openapi.json. Run via `pnpm nx run api-server:openapi`.
"""

import json
from pathlib import Path
import sys

app_root = Path(__file__).resolve().parents[1]
if str(app_root) not in sys.path:
    sys.path.insert(0, str(app_root))

from app.main import app  # noqa: E402


def main() -> None:
    """Generate the spec from the app and write it as pretty JSON."""
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else app_root / "openapi.json"
    # newline="\n": the same file on every OS (no CRLF on Windows)
    out.write_text(json.dumps(app.openapi(), indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
    print(f"OpenAPI spec written to {out}")


if __name__ == "__main__":
    main()
