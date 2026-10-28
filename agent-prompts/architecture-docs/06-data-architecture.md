# 06 – Data architecture

## Role

You are the data architect. Document the persistent data model, the multi-tenancy model, and how
schema change is managed. Generate everything that can be generated from code, so it can't drift.

## Read first

`STANDARDS.md`, `PROGRESS.md`, `AUDIT.md` (the data model notes and the items owned by 06), every
model under `kernel/backend/kernel/**/models/`, `kernel/core/database/*` (base, mixins, session,
migrations), `kernel/backend/migrations/`, `alembic.ini`, and `kernel.mdx` (sections Common columns,
Soft delete, Who made the change and Migrations).

## Pages and generators

1. **Entity-relationship diagrams (generated)**: a script imports the SQLAlchemy metadata of every
   installed plug-in and emits a Mermaid `erDiagram` per plug-in (tables, key columns, primary and
   foreign keys, relationship cardinality), plus an overview diagram. Add a stale check to the gates.
   Large tables show key columns only; link to the full column reference.
2. **Table reference (generated)**: per table, every column with its type, nullability, default,
   constraints, indexes and comment. Add column comments in the models where they're missing. That's
   a documentation change. Make sure the migrations are unaffected, or generate a migration if the
   comments are stored in the database, and record the decision.
3. **Common model conventions** (explanation): UUID primary keys, audit columns and how
   `created_by`/`updated_by` are set, soft delete (columns, query filtering, restore, interaction
   with unique constraints and indexes), and timestamps in UTC. Each convention links to the mixin
   and to the ADR from prompt 09.
4. **Multi-tenancy model**: tenants, tenant membership, which tables are tenant-scoped and how
   scoping is enforced (in queries, services or dependencies), what the `X-Tenant-ID` header does,
   isolation guarantees and their limits (be exact: application-level filtering versus database
   row-level security), and cross-tenant administrative access. Mark anything not yet enforced as a
   risk (prompt 10).
5. **Schema migrations**: Alembic per plug-in (how the version tables or branches work), auto-migrate
   at start-up versus a manual migrate, writing migrations (link to the existing guide), backwards
   compatibility rules for zero-downtime upgrades (state what's supported today), and rollback.
6. **Data lifecycle**: what is retained (soft-deleted records, sessions, password history, setup
   records), what is purged and when (only if there's code for it; otherwise it's a risk or open
   question), sensitive fields, and how they're protected (hashing, the cipher in
   `core/crypto`), with references.

## Rules

- Generators are deterministic, run in the docs build or the gates, and live in the repo with tests.
- Remove the duplicated content from `kernel.mdx` (A8), and keep links working.

## Definition of done

- The generated diagrams and reference exist, with stale checks.
- The explanation pages pass A and D.
- The gates pass.
- Commit as `docs(arch): data architecture, multi-tenancy and migrations`.
- STANDARDS §7 is met.
