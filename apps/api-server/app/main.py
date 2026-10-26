"""FastAPI Application Entry Point & Engine Runner."""

from pathlib import Path
import sys

# Ensure repository root and app directory are on sys.path for local discovery if not installed in site-packages
repo_root = Path(__file__).resolve().parents[3]
app_root = Path(__file__).resolve().parent.parent
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))
if str(app_root) not in sys.path:
    sys.path.insert(0, str(app_root))

from app.engine import ModuleLoader, ServerEngine
from kernel.config import get_settings

# Initialize Server Engine
settings = get_settings()
engine = ServerEngine(settings=settings)

# Module loader for registering ERP feature modules
loader = ModuleLoader(engine.registry)

# Expose standard FastAPI app instance for ASGI servers (uvicorn / fastapi dev)
app = engine.create_app()
