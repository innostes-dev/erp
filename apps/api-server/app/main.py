"""FastAPI application entry point for the backend engine.


Plug-in modules (kernel, ERP modules) are installed packages that register
under the `innostes.modules` entry-point group; `loader.discover()` loads
them all. Nothing here needs to change when a module is added.
"""

from pathlib import Path
import sys

# Make this app's own `app` package importable when started from elsewhere.
app_root = Path(__file__).resolve().parent.parent
if str(app_root) not in sys.path:
    sys.path.insert(0, str(app_root))

from app.engine import ModuleLoader, ServerEngine
from kernel.core.config import get_settings

# Initialize Server Engine
settings = get_settings()
engine = ServerEngine(settings=settings)

# Module loader for registering ERP feature modules
loader = ModuleLoader(engine.registry)
loader.discover()

# Expose standard FastAPI app instance for ASGI servers (uvicorn / fastapi dev)
app = engine.create_app()
