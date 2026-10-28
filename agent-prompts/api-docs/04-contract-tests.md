# 04 – Contract tests: documented behaviour equals real behaviour

## Role

You are the API quality engineer. A reference is only trustworthy if tests prove it. Build tests
that fail whenever the spec and the implementation disagree.

## Read first

`STANDARDS.md` (E9, E15, E16, S5), `PROGRESS.md`, `AUDIT.md` (items owned by 04), the existing tests
in `apps/api-server/tests` and `kernel/backend/tests`, and how those tests create the app and the
database.

## Build

1. **Per-status contract tests (E16)**: for every operation, a test per documented status code
   (success and each error) that:
   - calls the endpoint through the app (a test client against a test database)
   - asserts the status code
   - validates the response body against the schema the spec declares for that status code (load the
     spec the app generates, not the file)
   - asserts the documented headers (`Retry-After`, `WWW-Authenticate` if used)
   - for errors with a `code`, asserts the code

   Organise the tests by tag. Name each one so a failure reads as a sentence:
   `test_tenants_get__404_when_tenant_does_not_exist`.
2. **Undocumented-status guard**: a property-based run with Schemathesis (or Hypothesis with your
   own strategies, if Schemathesis can't run here) over every operation. It fails if any response
   status or body isn't declared in the spec. Use deterministic seeds and a bounded number of
   examples, so it's fast in CI. If the tool can't be used, explain why in `PROGRESS.md` and
   implement the minimum equivalent.
3. **Example executability**: a test that takes every request example in the spec, sends it to a
   freshly set-up app, and asserts it gets the documented success response (substituting IDs created
   in setup where needed). This proves E7 and E15 hold at runtime.
4. **Behaviour facts used by the guides**: tests for the facts prompt 06 will document:
   - token expiry and rotation (an old refresh token is rejected after rotation)
   - logout revocation
   - `X-Tenant-ID` handling
   - the setup-token attempt limit
   - pagination bounds (the `limit` maximum)
   - soft delete hiding records, `include_deleted`, restore
   - audit fields being set on create and update

   List each test name in `PROGRESS.md`. Guides must cite them (G2).
5. **Fix mismatches** found by these tests, at the root. If the docs are wrong, fix the docs in code
   (prompt 03's rules). If the behaviour is wrong, fix the behaviour with a test, and record it under
   "API changes".
6. Add all of this to the existing `test` targets, or to a new `contract-test` target that CI runs.

## Definition of done

- Every operation has a test for each of its documented status codes.
- The undocumented-status guard and the example tests pass in CI.
- The behaviour-fact tests are listed.
- Every mismatch is fixed.
- Commit as `test(api): contract tests for every documented response`.
- STANDARDS §8 is met.
