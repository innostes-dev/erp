"""The one-time setup token that protects the web setup wizard.

Only someone with access to the server can read it, so a stranger who finds
a fresh install on the network can't complete setup:

- If `SETUP_TOKEN` is set, that value is the token.
- Otherwise a random token is generated once into `SETUP_TOKEN_FILE` (shared by
  all worker processes) and printed in the server log on startup.
- After setup the generated file is deleted.

Wrong guesses are rate limited per client address (`AttemptLimiter`).
"""

from collections import deque
from dataclasses import dataclass
import hmac
import os
from pathlib import Path
import secrets
import threading
import time

from kernel.core.config import Settings, get_settings


@dataclass(frozen=True)
class SetupToken:
    """The current setup token and where it came from.

    Attributes:
        value: The token string.
        from_env: True if it came from `SETUP_TOKEN` (never log it then).
        path: File holding a generated token, or None.
    """

    value: str
    from_env: bool
    path: Path | None


def get_setup_token(settings: Settings | None = None) -> SetupToken:
    """Return the setup token, generating and storing one if needed.

    Args:
        settings: Settings to use (defaults to the app settings).

    Returns:
        The token and its source.
    """
    settings = settings or get_settings()
    if settings.setup_token is not None:
        return SetupToken(settings.setup_token.get_secret_value(), from_env=True, path=None)

    path = settings.setup_token_file
    if path.is_file():
        value = path.read_text(encoding="utf-8").strip()
        if value:
            return SetupToken(value, from_env=False, path=path)

    path.parent.mkdir(parents=True, exist_ok=True)
    value = secrets.token_urlsafe(32)
    try:
        # O_EXCL: if another worker created the file first, use theirs.
        fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    except FileExistsError:
        return SetupToken(path.read_text(encoding="utf-8").strip(), from_env=False, path=path)
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        f.write(value)
    return SetupToken(value, from_env=False, path=path)


def verify_setup_token(candidate: str | None, settings: Settings | None = None) -> bool:
    """Check a token sent by a client, in constant time.

    Args:
        candidate: Token from the request (None if missing).
        settings: Settings to use (defaults to the app settings).

    Returns:
        True if it matches the current setup token.
    """
    if not candidate:
        return False
    expected = get_setup_token(settings).value
    return hmac.compare_digest(candidate.encode("utf-8"), expected.encode("utf-8"))


def discard_setup_token(settings: Settings | None = None) -> None:
    """Delete the generated token file after setup (a `SETUP_TOKEN` is left alone).

    Args:
        settings: Settings to use (defaults to the app settings).
    """
    settings = settings or get_settings()
    settings.setup_token_file.unlink(missing_ok=True)


class AttemptLimiter:
    """Counts wrong setup tokens per client and blocks after too many.

    In-memory, per process. It makes guessing impractical even though a
    256-bit token can't realistically be guessed anyway.

    Attributes:
        max_attempts: Wrong tokens allowed per window.
        window_seconds: Length of the window.
    """

    def __init__(self, max_attempts: int = 10, window_seconds: float = 15 * 60) -> None:
        """Create a limiter.

        Args:
            max_attempts: Wrong tokens allowed per window.
            window_seconds: Length of the window in seconds.
        """
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        self._failures: dict[str, deque[float]] = {}
        self._lock = threading.Lock()

    def _recent(self, client: str, now: float) -> deque[float]:
        failures = self._failures.setdefault(client, deque())
        while failures and now - failures[0] >= self.window_seconds:
            failures.popleft()
        return failures

    def retry_after(self, client: str) -> int | None:
        """Seconds the client must wait, or None if it may try now.

        Args:
            client: Client identifier (IP address).
        """
        now = time.monotonic()
        with self._lock:
            failures = self._recent(client, now)
            if len(failures) < self.max_attempts:
                return None
            return max(1, int(self.window_seconds - (now - failures[0])) + 1)

    def record_failure(self, client: str) -> None:
        """Count one wrong token for the client."""
        with self._lock:
            self._recent(client, time.monotonic()).append(time.monotonic())

    def reset(self, client: str | None = None) -> None:
        """Clear the count for one client, or for everyone."""
        with self._lock:
            if client is None:
                self._failures.clear()
            else:
                self._failures.pop(client, None)


attempt_limiter = AttemptLimiter()
"""The limiter used by the setup routes."""
