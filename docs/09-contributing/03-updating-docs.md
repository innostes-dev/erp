# Updating Documentation

Documentation is part of the codebase. If you ship a feature without updating docs, the PR is incomplete. This guide explains where each type of change belongs and how to write it.

---

## Doc folder structure

```
docs/
├── 01-getting-started/       # Installation, first run
├── 02-architecture/          # System design, diagrams, module boundaries
├── 03-kernel/                # Kernel lib references (auth, state, event-bus)
│   ├── 01-auth.md
│   ├── 02-state.md
│   └── 03-event-bus.md
├── 04-creating-ui-module/    # How to scaffold a new frontend module
├── 05-creating-backend-module/ # How to scaffold a new NestJS module
├── 06-api/                   # API usage guides (auth flows, patterns)
├── 07-database/              # Schema, migrations, repositories
├── 08-styling/               # Tailwind, component patterns, cn()
│   └── 01-tailwind-guide.md
├── 09-contributing/          # Code style, git workflow, docs guide (this file)
│   ├── 01-code-style.md
│   ├── 02-git-workflow.md
│   └── 03-updating-docs.md
└── 10-troubleshooting/       # Error fixes, FAQ
    ├── 01-common-errors.md
    └── 02-faq.md
```

Folder numbers control display order. When adding a new top-level section, increment from the last used number.

---

## When to update docs

Update documentation when you:

- Add, change, or remove an API endpoint
- Add a new UI module or backend module
- Change how a kernel lib works (auth, state, event bus, etc.)
- Change a configuration value, environment variable, or startup step
- Add a new npm package with project-wide impact
- Change any behavior that existing docs describe

You do not need to document:

- Internal implementation details that are not visible to other contributors
- One-off scripts that are not part of the normal workflow
- Anything already captured in inline code comments (though prefer docs over comments for anything others will ask about)

---

## Which file to update

### Adding a new API endpoint

1. Add the endpoint to `docs/06-api/02-authentication-guide.md` if it is part of the auth flow.
2. Add it to `docs/08-api-reference.md` (the full API reference) with its request and response shape.
3. Add `@ApiOperation`, `@ApiResponse`, and `@ApiBody` Swagger decorators to the NestJS controller — the live `/developer/api` page auto-updates from these.

### Adding a new UI module

1. Follow the steps in `docs/04-creating-ui-module/` to scaffold the module.
2. Update `docs/02-architecture/` if the module changes the system diagram or introduces a new boundary.
3. Add a short entry to `docs/01-getting-started/` if the module requires any setup step.

### Adding a new kernel feature

1. Create a new file in `docs/03-kernel/` following the numbering sequence (`04-my-feature.md`).
2. Describe what the feature does, its API surface, and when to use it.
3. Link to it from `docs/02-architecture/` if it changes how modules communicate.

### Changing architecture

Update `docs/02-architecture/` first. If the change affects how contributors build modules or use the shell, also update the relevant section in `docs/04-creating-ui-module/` or `docs/05-creating-backend-module/`.

---

## Doc style guide

### Headings

- `#` H1 — one per file, the page title only.
- `##` H2 — major sections.
- `###` H3 — sub-sections within a major section.
- Do not use H4 or deeper. If you need more levels, split into a new file.

### Code blocks

Always include a language tag. Never use a bare triple-backtick without one.

````markdown
```ts
// TypeScript
```

```tsx
// TypeScript + JSX
```

```bash
# Shell commands
```

```json
// JSON
```
````

### Lists

- Use numbered lists for **steps** that must be followed in order.
- Use bullet lists for **options**, **features**, or **items** with no required order.

```markdown
1. Install dependencies.
2. Copy the env file.
3. Start the dev servers.

Options:
- Static user repository (default)
- Drizzle + PostgreSQL
```

### Callouts

Use the `> **Note:**` pattern for important information that a reader might miss.

```markdown
> **Note:** `getServerSession()` only works in Server Components. Importing it in a Client Component will throw at build time.
```

Use `> **Warning:**` for destructive or irreversible actions.

### Sentence length

Keep sentences under 25 words. Long sentences hide complexity. If a sentence needs a semicolon to hold together, split it into two sentences.

### Tables

Use tables when comparing options, showing type signatures, or mapping inputs to outputs. Do not use tables for steps — use numbered lists instead.

### Code examples

Every example must be complete and runnable. Do not use `// ...` to skip over required parts. If a full example is too long, break it into clearly labeled sections.

---

## Live API docs page (/developer/api)

The API docs page at `/developer/api` in the running shell fetches live data from `GET /api/docs-json`. That JSON is generated by NestJS Swagger at runtime from decorator metadata.

**No manual work is needed to update this page.** When you add or change a NestJS controller:

1. Add or update `@ApiOperation({ summary: '...' })` on the method.
2. Add `@ApiResponse({ status: 200, type: ResponseDto })` for each response code.
3. Add `@ApiBody({ type: RequestDto })` if the endpoint takes a body.

The live page reflects changes immediately when the API gateway restarts. The static docs files in `docs/06-api/` and `docs/08-api-reference.md` still need manual updates for the offline/readable version.
