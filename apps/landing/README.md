# @innostes/landing

The public marketing website and unified documentation platform for innostes ERP.

## Overview

`landing` is built with Next.js 16 and Fumadocs. It serves three distinct documentation spaces:
1. **Developer Documentation (`/docs`)**: Engineering handbook, arc42 architecture, runbooks, and developer guides.
2. **API Reference (`/api-reference`)**: Interactive OpenAPI specification and endpoint documentation.
3. **UI Documentation (`/ui/docs`)**: Component catalog, token references, and interactive previews for `@innostes/ui`.

## Commands

```bash
pnpm nx dev landing          # Dev server on http://localhost:3000
pnpm nx build landing        # Production build
pnpm nx run landing:docs-check # Verify documentation links and frontmatter
```

## Documentation

Full developer documentation is available at [landing Developer Guide](apps/landing/content/dev-docs/apps/landing.mdx).
