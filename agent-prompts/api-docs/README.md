# innostes ERP API: documentation runbook

These prompts produce documentation for the ERP HTTP API that an enterprise integration team can rely
on. That means a complete, accurate reference generated from the code, plus task-oriented guides
for the people who call the API (front-end developers, integration partners, operations).

**Out of scope**: architecture documentation (kernel internals, module loading, database design).
Internal architecture appears only where an API consumer must know it to use the API correctly.

The API is served by `apps/api-server` (FastAPI). Its endpoints come from the kernel modules in
`kernel/backend/kernel/*`, and the OpenAPI spec is generated from the code.

Run the prompts **one at a time, in order, each in a fresh agent session** from the repository
root. Agents share context only through the repository and [`PROGRESS.md`](./PROGRESS.md).

## Before you start

1. Commit or stash your work. The agents work on the branch `docs/api-reference`; prompt 01 creates
   it.
2. Make sure the Python environments install: `pnpm nx run api-server:install`. The kernel has its own
   `pnpm nx run kernel-backend:setup` target (check what it does before running it, since it may
   touch the database).
3. Agents need permission to run `pnpm`, `git` (local only), Python and a local API server.

## How to run each prompt

```text
Read agent-prompts/api-docs/STANDARDS.md and agent-prompts/api-docs/PROGRESS.md in full, then carry
out agent-prompts/api-docs/01-audit.md exactly. Do not stop until its Definition of done is met and
you have appended your entry to PROGRESS.md and committed.
```

After each run, read the agent's `PROGRESS.md` entry. If it lists **blocking** issues, rerun the
same prompt with: "Continue <prompt>. Resolve the blocking items in your previous PROGRESS.md entry."

## Order

| # | Prompt | Result |
| --- | --- | --- |
| 01 | [Audit](./01-audit.md) | Every endpoint and schema scored against the checklists. Nothing fixed |
| 02 | [Quality gates](./02-quality-gates.md) | Automated spec lint and spec-freshness checks in CI |
| 03 | [Endpoint documentation in code](./03-endpoint-docs-in-code.md) | Every route, parameter and schema documented at the source |
| 04 | [Contract tests](./04-contract-tests.md) | Tests proving the documented behaviour is the real behaviour |
| 05 | [Reference site](./05-reference-site.md) | The API reference rendered in the docs site, with code samples |
| 06 | [Guides](./06-guides.md) | Quickstart, authentication, errors, pagination, tenancy, and more |
| 07 | [Catalogues and policies](./07-catalogues-policies.md) | Error-code catalogue, schema reference, versioning, deprecation, changelog |
| 08 | [Module author guide](./08-module-author-guide.md) | How every future ERP module documents its endpoints |
| 09 | [QA and editorial pass](./09-qa-editorial.md) | Every sample run against a live server; links, voice, consistency |
| 10 | [Checklist verification](./10-checklist-verification.md) | Every endpoint, schema and page proven against every checklist item |

## Files

- [`STANDARDS.md`](./STANDARDS.md): the rules and the **checklists** (endpoint `E*`, schema `S*`,
  tag `T*`, guide page `G*`). The checklists are the definition of a documented endpoint.
- [`PROGRESS.md`](./PROGRESS.md): the shared log.
- `AUDIT.md` (prompt 01) and `CHECKLIST-REPORT.md` (prompt 10): the evidence before and after.
