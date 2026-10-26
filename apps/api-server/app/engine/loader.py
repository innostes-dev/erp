"""Module Loader for Innostes ERP Engine."""

import importlib
import logging
from typing import Any
from kernel.module import BaseModule, ModuleRegistry

logger = logging.getLogger("engine.loader")


class ModuleLoader:
    """Discovers, instantiates, and loads ERP modules into the engine."""

    def __init__(self, registry: ModuleRegistry) -> None:
        self.registry = registry

    def load_module(self, module_or_path: BaseModule | str) -> BaseModule | None:
        """Load a module instance or import from a module path string.

        Path format example: 'modules.sample' or 'modules.sample:SampleModule'
        """
        if isinstance(module_or_path, BaseModule):
            self.registry.register(module_or_path)
            return module_or_path

        if isinstance(module_or_path, str):
            try:
                if ":" in module_or_path:
                    mod_path, class_name = module_or_path.split(":", 1)
                    py_mod = importlib.import_module(mod_path)
                    cls = getattr(py_mod, class_name)
                    instance = cls()
                else:
                    py_mod = importlib.import_module(module_or_path)
                    # Look for exported 'module' instance or a subclass of BaseModule
                    if hasattr(py_mod, "module") and isinstance(py_mod.module, BaseModule):
                        instance = py_mod.module
                    else:
                        cls = getattr(py_mod, "Module", None)
                        if cls and issubclass(cls, BaseModule):
                            instance = cls()
                        else:
                            raise AttributeError(f"No BaseModule instance or class found in {module_or_path}")

                if isinstance(instance, BaseModule):
                    self.registry.register(instance)
                    return instance
            except Exception as exc:
                logger.warning("Failed to load module %s: %s", module_or_path, exc)
                return None

        return None

    def load_modules(self, module_list: list[BaseModule | str]) -> list[BaseModule]:
        """Load multiple modules into the registry."""
        loaded: list[BaseModule] = []
        for mod in module_list:
            result = self.load_module(mod)
            if result:
                loaded.append(result)
        return loaded
