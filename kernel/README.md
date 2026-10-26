# Innostes ERP Kernel

The **Kernel** is the shared foundational library for Innostes ERP. It provides core infrastructure components used by applications (such as `apps/api-server`) and domain business modules.

## Features
- **Config**: Pydantic-based settings with cascading `.env` discovery across apps, repo root, and working directories.
- **Database**: Async SQLAlchemy engine, resilient connection pooling, transactional `get_db` session dependency, declarative `Base`, and enterprise `BaseModel` (UUID + audit timestamps).
- **Module Architecture**: `BaseModule` contract and `ModuleRegistry` providing standardized lifecycle hooks (`on_startup`, `on_shutdown`), health checks, and route mounting.
- **Security**:
  - JWT token generation (`create_access_token`, `create_refresh_token`, `create_token_pair`) with custom payloads, standard claims (`sub`, `type`, `exp`, `iat`, `jti`), and cryptographically verified decoding (`verify_token`).
  - Bcrypt password hashing and verification (`hash_password`, `verify_password`).
  - FastAPI dependency injection (`get_current_subject`, `get_token_payload`).

## Usage
```python
from kernel.config import get_settings
from kernel.database import get_db, ping_db, BaseModel
from kernel.module import BaseModule, ModuleRegistry
from kernel.security import (
    create_access_token,
    create_refresh_token,
    create_token_pair,
    verify_token,
    hash_password,
    verify_password,
)

# JWT generation
token_pair = create_token_pair(
    subject="usr_12345",
    payload={"role": "admin", "tenant_id": "tenant_001"},
)
print("Access token:", token_pair.access_token)
print("Refresh token:", token_pair.refresh_token)

# Password hashing
hashed = hash_password("secret_password")
assert verify_password("secret_password", hashed)
```
