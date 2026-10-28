# Documentation Quality Gates

Automated, deterministic quality gates enforcing enterprise design system documentation standards across `apps/landing/content/docs` and `apps/landing/content/dev-docs`.

## Running Checks

```sh
# Run all gates through Nx
pnpm nx run landing:docs-check

# Run standalone
node apps/landing/scripts/checks/run-all.mjs
```

## Gate Definitions

| Gate | Script | Mode | Description |
| :--- | :--- | :--- | :--- |
| **Links** | `check-links.mjs` | **Enforced** | Verifies all internal markdown links and `#anchor` targets resolve to existing pages and headings matching Fumadocs slug generation. |
| **Demos** | `check-demos.mjs` | **Enforced** | Asserts every `<ComponentPreview name>` targets an existing demo, all demos on disk are referenced, and imports are restricted to sanctioned packages. |
| **Sidebar** | `check-sidebar.mjs` | **Enforced** | Verifies that all pages are declared in their folder's `meta.json` and that all `meta.json` entries exist. |
| **MDX Safety** | `check-mdx-safety.mjs` | **Enforced** | Catches unescaped JavaScript braces (e.g. `{tag}`) in prose before Next.js build compilation fails. |
| **Consistency** | `check-consistency.mjs` | **Enforced** | Validates that the version displayed in the UI documentation header matches `packages/ui/package.json`. |
| **Prose Lint** | `check-prose.mjs` | **Enforced** | Prevents banned AI/marketing buzzwords (STANDARDS §5), emoji, exclamation marks, and generic placeholder names. |
| **Frontmatter** | `check-frontmatter.mjs` | Report (Enforced in 12) | Checks component pages for `title`, `description` (one sentence ending with a full stop), `icon`, `status`, and `summary`. |
| **Coverage** | `check-coverage.mjs` | Report (Enforced in 12) | Ensures every public library export is documented in an `<ApiTable>` or explicitly listed in `docs-coverage-allowlist.json`. |
| **API Tables** | `check-api-tables.mjs` | Report (Enforced in 12) | Validates that components referenced in `<ApiTable>` exist in `dist/api.json` with documented props. |
| **Template** | `check-template.mjs` | Report (Enforced in 12) | Asserts component pages follow standard heading order and sentence case. |
| **Spelling** | `check-prose.mjs` | Report (Enforced in 17) | Flags American English spellings in favor of British English. |

## Adding an Allowlist Entry

When a helper or internal export (such as `cn` or utility functions) is documented in prose rather than an `<ApiTable>` component table, add it to `docs-coverage-allowlist.json` with an explicit reason:

```json
{
  "myHelper": "Helper function for ... documented in conventions and installation."
}
```

Every entry requires a substantive reason explaining where and why it is documented.

## Inline Prose Ignores

To suppress a false positive on a line of prose, add an inline comment with a required reason immediately preceding the line:

```mdx
{/* prose-ignore: legitimate use of quote */}
The customer exclaimed!
```
