# Innostes ERP Kernel

The **Kernel** is the shared foundational library for Innostes ERP. It provides core infrastructure components used by applications (such as `apps/api-server`) and domain business modules.

## Features
- **Config**: Pydantic-based settings with cascading `.env` discovery across apps, repo root, and working directories.
- **Database**: Async SQLAlchemy engine, resilient connection pooling, transactional `get_db` session dependency, declarative `Base`, and enterprise `BaseModel` (UUID + audit timestamps). Settings are organized in `database/db_settings.py`.
- **Module Architecture**: `BaseModule` contract and `ModuleRegistry` providing standardized lifecycle hooks (`on_startup`, `on_shutdown`), health checks, and route mounting.
- **Security**: JWT token generation (`create_access_token`, `create_refresh_token`) and verification (`decode_token`).

## Usage
```python
from kernel.config import get_settings
from kernel.database import get_db, ping_db, BaseModel
from kernel.database.db_settings import PostgresSettings
from kernel.module import BaseModule, ModuleRegistry
from kernel.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
)

# JWT generation
access_token = create_access_token({"sub": "user_123", "role": "admin"})
refresh_token = create_refresh_token({"sub": "user_123"})
```
