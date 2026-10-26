"""Environment Discovery and Parsing Utility for Innostes ERP Kernel."""

from pathlib import Path


def find_env_files() -> list[Path]:
    """Find candidate .env files in app directory, parent directories, and current working directory."""
    current_file = Path(__file__).resolve()
    repo_root = current_file.parents[2] if len(current_file.parents) > 2 else current_file.parent

    candidates = [
        # Working directory .env
        Path.cwd() / ".env",
        Path.cwd() / ".env.local",
        # Kernel package .env
        current_file.parents[1] / ".env" if len(current_file.parents) > 1 else None,
        current_file.parents[1] / ".env.local" if len(current_file.parents) > 1 else None,
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
