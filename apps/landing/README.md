# Innostes Business OS: Landing & Documentation Platform

The public marketing website, architecture handbook, and unified documentation portal for the **Innostes Business Operating System (Business OS)**.

`apps/landing` is built with **Next.js 16** (App Router), **React 19**, **Fumadocs**, and the **@innostes/ui** design system. It serves both as the public brand gateway for Innostes and as the single source of truth for developer, API, and design system documentation.

---

## 1. Documentation Spaces

`landing` powers four integrated experiences:

1. **Brand Homepage (`/`)**:
   - Modern marketing landing page showcasing Innostes as the Extensible Business Operating System.
   - Dual-Mode Hero showcasing Turnkey UI vs Headless OpenAPI terminal side-by-side.
   - Interactive module matrix for SalesFlow, PeopleOps, Tracura, and future suites.
   - Transparent commercial model with the 3 pathways: Community (Free), Assisted Deployment, and Bespoke Engineering.
   - Interactive quote & deployment inquiry modal.
2. **Developer Documentation (`/docs`)**:
   - Comprehensive engineering manual structured according to the **arc42** architectural framework.
   - C4 Building Block views, ADRs (MADR 4.x), plug-in contracts, and threat models.
3. **API Reference (`/api-reference`)**:
   - Searchable, interactive OpenAPI 3.1 documentation rendered directly from `apps/api-server/openapi.json`.
   - Real request/response schemas, cURL snippets, and error catalogue.
4. **UI Design System (`/ui/docs`)**:
   - Complete component catalog, live sandboxes, and OKLCH color token visualizers for `@innostes/ui`.
   - APCA / WCAG accessibility guidelines and enterprise layout patterns.

---

## 2. Technology Stack

- **Framework**: Next.js 16 with React 19 Server Components
- **Documentation Engine**: Fumadocs MDX with full-text search
- **Design System**: `@innostes/ui` with Tailwind CSS v4 design tokens
- **Diagrams**: Native Mermaid diagram compilation
- **Code Highlighting**: Shiki with dark and light enterprise syntax themes

---

## 3. Development Commands

```bash
# Start local development server (http://localhost:3000)
pnpm nx dev landing

# Run production build and static export
pnpm nx build landing

# Run all 16 documentation quality gates (link checks, frontmatter, prose, etc.)
pnpm nx run landing:docs-check

# Run architecture-specific documentation checks (arc42, ADRs, diagrams)
pnpm nx run landing:arch-docs-check
```

---

## 4. Documentation Quality Gates

All documentation in `apps/landing/content/` must pass automated quality gates before merging:
- **Link Resolution**: Verifies that every internal markdown link and `#anchor` resolves to an existing page and heading.
- **Demos Verification**: Confirms every `<ComponentPreview>` references an existing demo on disk.
- **Prose & British English**: Prevents forbidden marketing jargon/buzzwords and enforces consistent spelling.
- **API Spec Freshness**: Ensures code snippets and schemas reflect the latest `apps/api-server/openapi.json`.

For details on authoring and extending documentation, see [apps/landing/scripts/checks/README.md](scripts/checks/README.md).

---

## 5. License

Open-source software licensed under the **[MIT License](../../LICENSE)**.
