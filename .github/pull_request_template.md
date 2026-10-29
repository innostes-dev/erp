## Summary of Changes

<!-- Provide a brief description of the motivation and context for these changes. -->

## Type of Change

- [ ] New feature (non-breaking change adding functionality)
- [ ] Bug fix (non-breaking change fixing a defect)
- [ ] Breaking change (fix or feature modifying existing contracts or behaviour)
- [ ] Documentation update
- [ ] Performance improvement or refactoring

---

## API Change Checklist

> [!IMPORTANT]
> If this PR modifies, adds, or removes any HTTP endpoints, schemas, headers, or error behaviours in `apps/api-server` or `kernel/backend`, complete this checklist before requesting review.

### Operations (E1–E17)

- [ ] **E1**: `operation_id` is `<feature>_<action>`, unique and snake_case (e.g. `invoices_create`).
- [ ] **E2**: `summary` is imperative, sentence case, <= 60 characters with no trailing full stop.
- [ ] **E3**: Public description before `\f` states what endpoint does, authorized roles, side effects, and idempotency (no implementation details).
- [ ] **E4**: Exactly one tag, and that tag is described in `openapi_tags`.
- [ ] **E5**: Explicit security in `openapi_extra={"security": [...]}` matches actual dependencies.
- [ ] **E6**: Parameters have `description`, `examples`, format (e.g. `uuid`), and validation constraints.
- [ ] **E7**: Request body has full schema with examples (S1–S8) and correct required fields.
- [ ] **E8**: Success status code (`201` for create, `204` for no content, `200` otherwise), `response_model`, `response_description`, and complete example.
- [ ] **E9**: `responses=error_responses(...)` lists exactly the errors possible; includes `401`/`403` when authenticated, `422` for validated inputs.
- [ ] **E10**: Every machine `code` value is defined in `ErrorCode` constants and documented in the error catalogue.
- [ ] **E11**: Custom headers (`X-Tenant-ID`, setup token) and response headers are declared in the spec.
- [ ] **E12**: List endpoints use `Page` schema with `skip` and `limit` (max 200).
- [ ] **E13**: Soft delete and restore semantics are clearly documented.
- [ ] **E14**: Deprecated operations declare `deprecated=True`, successor route, and sunset date.
- [ ] **E15**: Every spec example validates against its schema.
- [ ] **E16**: Contract tests (`test_contract_*.py`) cover every documented status code.
- [ ] **E17**: Examples use Northwind Traders Pvt Ltd data with `.example` emails and no real secrets.

### Schemas (S1–S8)

- [ ] **S1**: Class docstring defines schema summary.
- [ ] **S2**: Every field has `description=` and `examples=[...]`.
- [ ] **S3**: Validation constraints (`ge`, `le`, `min_length`, `max_length`, `pattern`) are declared in schema.
- [ ] **S4**: Enums document every allowable value and its meaning.
- [ ] **S5**: Optional vs nullable accurately represents database and API reality.
- [ ] **S6**: Read schemas have complete, realistic Northwind universe examples in `json_schema_extra`.
- [ ] **S7**: Consistent naming (`<Entity>Create`, `<Entity>Update`, `<Entity>Read`, `<Entity>Page`).
- [ ] **S8**: No internal IDs, password hashes, or private tokens leak into response schemas.

### Tags (T1–T3)

- [ ] **T1**: Tag has a clear description of domain area and users.
- [ ] **T2**: Logical tag placement in the API navigation tree.
- [ ] **T3**: Sentence case tag name ("User management", not "User Management").

### Verification Gates & Deliverables

- [ ] **Regenerate OpenAPI spec**: `pnpm nx run api-server:openapi`
- [ ] **Freshness gate passes**: `pnpm nx run api-server:openapi-check`
- [ ] **Spec lint gate passes**: `pnpm nx run api-server:openapi-lint`
- [ ] **Contract tests pass**: `pnpm nx run api-server:contract-test`
- [ ] **Docs quality gates pass**: `pnpm nx run landing:docs-check`
- [ ] **Changelog updated**: `apps/api-server/CHANGELOG.md` updated with Keep a Changelog entry if spec shape changed.

---

## General PR Checklist

- [ ] Code follows repository style guidelines and British English spelling conventions.
- [ ] Unit tests added or updated to cover all new functionality.
- [ ] `pnpm nx run-many -t lint test typecheck build` passes locally.
