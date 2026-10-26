"""Environment Discovery and Parsing Utility for Innostes ERP Kernel."""

import os
from pathlib import Path


def find_env_files() -> list[Path]:
    """Find candidate .env files in app directory, parent directories, and current working directory."""
    current_file = Path(__file__).resolve()
    repo_root = current_file.parents[5] if len(current_file.parents) > 5 else current_file.parent

    candidates = [
        # Working directory .env
        Path.cwd() / ".env",
        Path.cwd() / ".env.local",
        # Kernel backend project .env (kernel/backend)
        current_file.parents[3] / ".env" if len(current_file.parents) > 3 else None,
        current_file.parents[3] / ".env.local" if len(current_file.parents) > 3 else None,
        # API server app .env
        repo_root / "apps" / "api-server" / ".env",
        repo_root / "apps" / "api-server" / ".env.local",
        # Repository root .env
        repo_root / ".env",
        repo_root / ".env.local",
    ]

    seen: set[Path] = set()
    valid_paths: list[Path] = []
    for candidate in candidates:
        if candidate and candidate.is_file():
            resolved = candidate.resolve()
            if resolved not in seen:
                seen.add(resolved)
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


def load_env() -> dict[str, str]:
    """Merge all discovered `.env` files with the process environment.

    The first `.env` file that defines a key wins (see `find_env_files` for the
    order); real environment variables override every file.

    Returns:
        Variable name -> value.
    """
    merged: dict[str, str] = {}
    for env_path in find_env_files():
        for key, value in parse_env_file(env_path).items():
            merged.setdefault(key, value)
    merged.update(os.environ)
    return merged
