# 02 – Quality gates for the API spec

## Role

You are the staff engineer for API platform tooling. Encode the checklists as automated checks, so
the spec can't regress.

## Read first

`STANDARDS.md`, `PROGRESS.md`, `AUDIT.md`, `apps/api-server/scripts/export_openapi.py`, the
`project.json` files of `api-server` and `kernel-backend`, and `.github/workflows/ci.yml`.

## Build

1. **Spec freshness**: a target `api-server:openapi-check` regenerates the spec to a temp file and
   fails if it differs from the committed `openapi.json`, printing the diff. Wire it into CI.
2. **Spec lint**: a target `api-server:openapi-lint`. Use Spectral, run via `pnpm dlx` or as a root
   dev dependency, with a repo ruleset at `apps/api-server/.spectral.yaml`. If Spectral can't
   express a rule, use a small Python checker on the generated spec. Cover the mechanically checkable
   items:
   - E1: the `operation_id` pattern, and uniqueness
   - E2: summary length, case and no trailing full stop
   - E3: a non-empty description, and no `Args:`/`Returns:` text leaked from before `\f`
   - E4: exactly one tag, which is declared and described
   - E5: an explicit `security` on every operation, or an empty array for public ones
   - E6: every parameter has a description, an example and a schema format where it's a UUID or a
     date
   - E8: a success response with a schema and an example
   - E9 (partial): every operation with parameters or a body documents `422`; every secured one
     documents `401`
   - E11: declared header parameters for the known headers
   - E12: list operations reference the `Page` schema and have `offset` and `limit`
   - E14: deprecated operations have a description that mentions their replacement
   - E15: **every example validates against its schema** (use `jsonschema` with the 3.1 dialect)
   - E17: no example email outside `.example`; no string that looks like a real secret
   - S1, S2, S4 and S6: schema descriptions, field descriptions and examples, enum descriptions,
     read-schema examples
   - T1 and T3: tag descriptions and sentence case

   Each violation prints the operation or schema, the checklist ID and the fix hint.
3. **Report and enforce modes**: rules that the current code fails run in report mode, listing the
   violations with exit 0, controlled by one config list of rule IDs. Record the counts in
   `PROGRESS.md`. Prompt 03 removes rules from the report list as it fixes them. Prompt 10 requires
   the list to be empty.
4. **CI**: add `openapi-check` and `openapi-lint` jobs. They need the Python environments. Follow
   how CI already installs them, or add the minimum steps.
5. **Docs**: describe the gates in `kernel/backend/README.md` § "Documentation standards"
   (commands, report and enforce modes, how to add a justified exception).

## Rules

- Exceptions need a reason, kept in one file (`apps/api-server/openapi-lint-exceptions.yaml`).
- Never loosen a rule to pass. Fixing the code is prompt 03's job.

## Definition of done

Both targets exist, run in CI and are documented. Enforced rules pass. Report-mode counts are
recorded. Commit as `ci(api): spec freshness and lint gates`. STANDARDS §8 is met.
