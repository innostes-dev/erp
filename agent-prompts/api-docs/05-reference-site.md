# 05 – API reference in the docs site

## Role

You are the docs-platform engineer. Publish the API reference in the existing docs site
(`apps/landing`, Fumadocs) with the quality of a top public API reference. It's generated from
`openapi.json`, so it can never drift.

## Read first

`STANDARDS.md`, `PROGRESS.md`, `apps/landing/lib/source.ts`, `app/(docs)/**`,
`components/docs/*`, `components/mdx.tsx`, `content/dev-docs/guides/writing-docs.mdx`, and the
Fumadocs version in `apps/landing/package.json`. For the OpenAPI integration, read the docs of the
`fumadocs-openapi` version compatible with that Fumadocs version, inside `node_modules` after
installing. Don't guess APIs.

## Tasks

1. **Collection and route**:
   - Add a third docs collection, `content/api-docs`, served at `/api-reference` (not `/api`, which
     the Next.js route handlers use).
   - Add it to the header navigation, and to the developer docs' cross-links.
   - The UI docs and developer docs must keep working unchanged.
2. **Generated reference**:
   - Use `fumadocs-openapi` (or the equivalent for this Fumadocs version) to generate one page per
     operation from `apps/api-server/openapi.json`, grouped by tag in the tag order.
   - Each operation page shows:
     - method and path
     - the description
     - authentication requirements
     - the parameters and headers
     - the request body schema and example
     - every response, with its schema and example
     - generated code samples in `curl`, TypeScript (`fetch`) and Python (`httpx`)
   - Generation runs in the docs build (or a script the build runs first), never by hand. Add a
     check that fails if the generated pages are stale against the spec.
3. **Schemas**: a browsable schema section, or links from each operation into a schema page, with
   field descriptions, constraints and enum meanings.
4. **Try it**: if the OpenAPI integration supports it, enable a request playground that targets a
   configurable base URL (default `http://localhost:8001`). Add a clear note that it calls *your*
   server. If CORS blocks it locally, document the `CORS_ORIGINS` setting needed.
5. **Downloads**: serve `openapi.json` from a stable URL on the site (e.g.
   `/api-reference/openapi.json`) for client generation, and link to it from the overview.
6. **Overview page** (`/api-reference`):
   - base URLs
   - authentication in two sentences
   - the conventions (IDs, timestamps, pagination, soft delete, errors), each in one line linking to
     its guide (prompt 06)
   - the tag list with descriptions
   - the spec download
   - Keep it short. The guides carry the detail.
7. **Search, SEO and metadata**:
   - operations are searchable by path, `operation_id` and summary
   - the title template is `<Summary> – innostes ERP API`
   - a sitemap entry for every page
8. **Visual consistency**: the same theme, typography and dark mode as the rest of the site.
   Method badges use semantic tokens, not raw colours.
9. **Authoring docs**: add the API collection, the generation step and the stale check to
   `writing-docs.mdx` and the dev-docs page for `landing`.

## Definition of done

- `/api-reference` renders every operation and schema from the spec, with code samples, in both
  themes and at 360px, with no console errors.
- The stale check passes and runs in CI.
- `pnpm nx build landing` passes.
- Commit as `feat(docs): generated API reference`.
- STANDARDS §8 is met.
