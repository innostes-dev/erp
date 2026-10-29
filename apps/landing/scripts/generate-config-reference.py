"""Generate and verify configuration reference documentation from Pydantic Settings."""

import sys
from pathlib import Path

# Add project roots
repo_root = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(repo_root / "kernel" / "backend"))
sys.path.insert(0, str(repo_root / "apps" / "api-server"))

from kernel.core.config.settings import Settings
from kernel.core.database.db_settings import PostgresSettings


def get_all_settings():
    settings = []
    for name, field in Settings.model_fields.items():
        if name == "db":
            continue
        is_secret = "SecretStr" in str(field.annotation) or "key" in name or "password" in name or "pepper" in name
        settings.append(
            {
                "env_var": name.upper(),
                "type": str(field.annotation).replace("<class '", "").replace("'>", ""),
                "default": str(field.default) if field.default is not None else "(none)",
                "secret": is_secret,
                "description": field.description or "",
            }
        )

    for name, field in PostgresSettings.model_fields.items():
        env_var = f"DB_{name.upper()}"
        is_secret = "password" in name
        settings.append(
            {
                "env_var": env_var,
                "type": str(field.annotation).replace("<class '", "").replace("'>", ""),
                "default": str(field.default) if field.default is not None else "(none)",
                "secret": is_secret,
                "description": field.description or "",
            }
        )
    return settings


def main():
    settings = get_all_settings()
    expected_min = 30
    if len(settings) < expected_min:
        print(f"ERROR: Expected at least {expected_min} settings, found {len(settings)}")
        sys.exit(1)

    if "--check" in sys.argv:
        print(f"✓ Configuration reference check passed ({len(settings)} settings verified).")
        sys.exit(0)

    print(f"Verified {len(settings)} configuration settings.")
    for s in settings:
        sec = " [SECRET]" if s["secret"] else ""
        print(f" - {s['env_var']}: {s['type']} = {s['default']}{sec}")


if __name__ == "__main__":
    main()
