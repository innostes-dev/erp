# Innostes ERP Kernel

The **Kernel** is the shared foundational library for Innostes ERP. It provides core infrastructure components used by applications (such as `apps/api-server`) and domain business modules.

## Features
- **Config**: Pydantic-based settings with cascading `.env` discovery across apps, repo root, and working directories.
- **Database**: Async SQLAlchemy engine, resilient connection pooling, transactional `get_db` session dependency, declarative `Base`, and enterprise `BaseModel` (UUID + audit timestamps).
- **Module Architecture**: `BaseModule` contract and `ModuleRegistry` providing standardized lifecycle hooks (`on_startup`, `on_shutdown`), health checks, and route mounting.

## Usage
```python
from kernel.config import get_settings
from kernel.database import get_db, ping_db, BaseModel
from kernel.module import BaseModule, ModuleRegistry

settings = get_settings()
```
