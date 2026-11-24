"""Extract kernel-only DDL from `alembic upgrade head --sql` output into docs/backend-parity/schema.sql.

Usage: python scripts/parity/gen_schema.py <alembic-offline.sql>
"""
import pathlib, re, sys

KERNEL = {"tenants", "installation", "users", "user_profiles", "user_security", "password_histories",
          "user_devices", "user_sessions", "permissions", "roles", "role_permissions", "tenant_members",
          "user_roles", "tenant_settings", "user_identities", "tenant_modules", "tenant_plugins",
          "api_keys", "audit_logs", "user_module_grants"}
src = pathlib.Path(sys.argv[1]).read_text()
keep = []
for stmt in re.split(r";\s*\n", src):
    s = stmt.strip()
    body = "\n".join(l for l in s.splitlines() if not l.startswith("--") and not l.startswith("INFO")).strip()
    body = re.sub(r"^(BEGIN|COMMIT);\s*", "", body).strip()
    if not body or "alembic_version" in body:
        continue
    m = (re.search(r"CREATE (?:UNIQUE )?INDEX \S+ ON (\w+)", body) or re.search(r"CREATE TABLE (\w+)", body)
         or re.search(r"ALTER TABLE (\w+)", body))
    if m and m.group(1) in KERNEL:
        keep.append(body.strip() + ";")
    elif body.startswith("CREATE TYPE") and body not in [k.rstrip(";") for k in keep]:
        keep.append(body.strip() + ";")
out = pathlib.Path(__file__).resolve().parents[2] / "docs/backend-parity/schema.sql"
out.write_text("-- Reference kernel schema (generated from Alembic by scripts/parity/gen_schema.py).\n"
               "-- Source of truth for Laravel and NestJS migrations.\n\n" + "\n\n".join(keep) + "\n")
print(len(keep), "statements ->", out)
