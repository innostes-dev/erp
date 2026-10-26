"""Module loader for the backend engine.

Plug-in modules (the kernel features and ERP modules) are separate Python
packages installed into the api-server environment. Each one registers its
`BaseModule` instance under the `innostes.modules` entry-point group in its
`pyproject.toml`:

    [project.entry-points."innostes.modules"]
    tenancy = "kernel.tenancy:module"

`ModuleLoader.discover()` loads every registered module, so adding a module
never requires changing api-server code.
"""

import importlib
from importlib.metadata import entry_points
import logging
from kernel.core.module import BaseModule, ModuleRegistry

logger = logging.getLogger("engine.loader")


ENTRY_POINT_GROUP = "innostes.modules"


class ModuleLoader:
    """Finds ERP modules and registers them with the engine.

    Attributes:
        registry: Registry the loaded modules are added to.
    """

    def __init__(self, registry: ModuleRegistry) -> None:
        """Create a loader that fills `registry`.

        Args:
            registry: The engine's module registry.
        """
        self.registry = registry

    def discover(self, group: str = ENTRY_POINT_GROUP) -> list[BaseModule]:
        """Load every installed module registered under the entry-point group.

        A module that fails to import is logged and skipped so one broken
        plug-in does not stop the server.

        Args:
            group: Entry-point group to scan (default `innostes.modules`).

        Returns:
            The modules that were loaded, sorted by entry-point name.
        """
        loaded: list[BaseModule] = []
        for ep in sorted(entry_points(group=group), key=lambda e: e.name):
            try:
                obj = ep.load()
            except Exception as exc:
                logger.error("Failed to import module %r (%s): %s", ep.name, ep.value, exc)
                continue
            instance = obj() if isinstance(obj, type) and issubclass(obj, BaseModule) else obj
            if not isinstance(instance, BaseModule):
                logger.error("Entry point %r (%s) is not a BaseModule", ep.name, ep.value)
                continue
            self.registry.register(instance)
            loaded.append(instance)
            logger.info("Loaded module %r v%s", instance.name, instance.version)
        return loaded

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
