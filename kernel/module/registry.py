"""Module Registry for Innostes ERP Modules."""

from typing import Iterable
from kernel.module.base import BaseModule


class ModuleRegistry:
    """Central container storing and providing discovered ERP modules."""

    def __init__(self) -> None:
        self._modules: dict[str, BaseModule] = {}

    def register(self, module: BaseModule) -> None:
        """Register a feature module."""
        self._modules[module.name] = module

    def unregister(self, name: str) -> None:
        """Unregister a feature module by name."""
        self._modules.pop(name, None)

    def get(self, name: str) -> BaseModule | None:
        """Get a registered module by name."""
        return self._modules.get(name)

    def list_modules(self) -> list[BaseModule]:
        """List all currently registered modules."""
        return list(self._modules.values())

    def __iter__(self) -> Iterable[BaseModule]:
        return iter(self._modules.values())

    def __len__(self) -> int:
        return len(self._modules)
