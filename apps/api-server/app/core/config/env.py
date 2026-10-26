"""Environment Discovery and Parsing Utility."""

from pathlib import Path


def find_env_files() -> list[Path]:
    """Find candidate .env files in app directory, parent directories, and current working directory."""
    candidates = [
        # App-specific .env (apps/api-server/.env)
        Path(__file__).resolve().parents[3] / ".env",
        Path(__file__).resolve().parents[3] / ".env.local",
        # Current working directory .env
        Path.cwd() / ".env",
        Path.cwd() / ".env.local",
        # Repository root .env (if different from cwd)
        Path(__file__).resolve().parents[5] / ".env"
        if len(Path(__file__).resolve().parents) > 5
        else None,
    ]
    seen = set()
    valid_paths: list[Path] = []
    for candidate in candidates:
        if candidate and candidate.is_file() and candidate.resolve() not in seen:
            seen.add(candidate.resolve())
            valid_paths.append(candidate)
    return valid_paths


def parse_env_file(filepath: Path) -> dict[str, str]:
    """Parse a .env file into key-value pairs without requiring external libraries."""
    env_vars: dict[str, str] = {}
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" in line:
                    key, val = line.split("=", 1)
                    key = key.strip()
                    val = val.strip()
                    # Strip surrounding quotes if present
                    if (val.startswith('"') and val.endswith('"')) or (
                        val.startswith("'") and val.endswith("'")
                    ):
                        val = val[1:-1]
                    env_vars[key] = val
    except Exception:
        pass
    return env_vars
