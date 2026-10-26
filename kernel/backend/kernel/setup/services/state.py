"""Process-wide cache of "is this system installed?".

Checked on every API request by the setup middleware, so it must be cheap:

- Once installed, the answer is cached forever (installation is permanent).
- "Not installed" is re-checked at most every `RECHECK_SECONDS`, so other
  worker processes notice an install made elsewhere within seconds.
"""

from collections.abc import Awaitable, Callable
import time


class InstallState:
    """Cached installed flag for this process.

    Attributes:
        recheck_seconds: How long a "not installed" answer is trusted.
    """

    def __init__(self, recheck_seconds: float = 2.0) -> None:
        """Create an empty cache.

        Args:
            recheck_seconds: How long a "not installed" answer is trusted.
        """
        self.recheck_seconds = recheck_seconds
        self._installed = False
        self._checked_at: float | None = None

    async def is_installed(self, check: Callable[[], Awaitable[bool]]) -> bool:
        """Return the cached answer, calling `check` when it is missing or stale.

        Args:
            check: Coroutine function that asks the database.

        Returns:
            True if the system is installed.

        Raises:
            Exception: Whatever `check` raises (e.g. the database is down).
                Nothing is cached in that case.
        """
        if self._installed:
            return True
        now = time.monotonic()
        if self._checked_at is not None and now - self._checked_at < self.recheck_seconds:
            return False
        self._installed = await check()
        self._checked_at = now
        return self._installed

    def mark_installed(self) -> None:
        """Remember that setup just completed in this process."""
        self._installed = True

    def reset(self) -> None:
        """Forget the cached answer (used by tests)."""
        self._installed = False
        self._checked_at = None


install_state = InstallState()
"""The cache shared by the middleware, the setup routes and the CLI."""
