# 07 – Catalogues and policies

## Role

You are the API product owner. Integrators need reference catalogues they can program against, and
explicit policies about change. Generate the catalogues from code, and write policies the team can
actually keep.

## Read first

`STANDARDS.md`, `PROGRESS.md` (every "API changes" entry, and the version decision from prompt 03),
`AUDIT.md` (items owned by 07), and `kernel/core/services/errors.py`.

## Tasks

1. **Error-code catalogue** (E10):
   - Generate a page from the code that lists every machine `code` value the API can return, with
     the status code, the meaning, the endpoints that return it, and what a caller should do.
   - Also list the HTTP statuses the API actually uses, with their meaning in this API.
   - If codes are currently ad-hoc strings scattered in services, centralise them as constants (a
     documentation-driven refactor with no behaviour change; record it), so the generator can find
     them.
   - Add a check that fails when a new `code` appears without a catalogue entry.
2. **Schema and field reference**: if prompt 05's integration doesn't already provide a complete
   schema index, generate one, so `Tenant`, `User`, `Page` and so on each have a stable URL.
3. **Versioning and compatibility policy**:
   - what counts as breaking (removing or renaming fields, `operation_id`s, tags; changing status
     codes; tightening validation; changing defaults) versus non-breaking (new optional fields, new
     endpoints, new error codes)
   - how the API is versioned (decide: URL prefix versus header versus spec version only; record the
     reasoning)
   - how long old behaviour is supported
   - Keep it realistic for this team.
4. **Deprecation policy**: how deprecations are announced (`deprecated: true`, the description, the
   changelog, a `Deprecation` and `Sunset` response header if implemented), and the minimum notice.
   Document only header behaviour that exists, or implement it with tests if the policy needs it.
5. **API changelog**:
   - `apps/api-server/CHANGELOG.md` in Keep a Changelog format, rendered in the docs
   - Seed it from `PROGRESS.md` "API changes" and git history.
   - Add a check that fails when the spec changes shape (compare against the last release's spec
     with an OpenAPI diff tool such as `oasdiff`) without a changelog entry.
6. **Limits and quotas page**: request size limits, the pagination maximum, the attempt limits
   (setup token), password rules, and token lifetimes. Values come from the settings and the code,
   and the page states which settings change them.
7. **Security page**: how to report vulnerabilities (shared with the repo's `SECURITY.md` if one
   exists), the token handling recommendations, the data retention of soft-deleted records, and the
   audit trail. Facts only.

## Definition of done

- The generated catalogues exist, with stale checks in CI.
- The policies are written and consistent with the code.
- The changelog exists, with a shape-change check.
- `pnpm nx build landing` passes.
- Commit as `docs(api): error catalogue, versioning, deprecation and changelog`.
- STANDARDS §8 is met.
