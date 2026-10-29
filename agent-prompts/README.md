# Innostes ERP: Agent Prompts & Documentation System

This directory houses the standardized prompts, instructions, and quality checklists for autonomous AI coding agents (Antigravity, Gemini, Claude, Jules, Cursor) and human contributors working across the Innostes ERP monorepo.

---

## Authoritative Documentation Contract

* [`LLM-DOCUMENTATION-CHECKLIST.md`](./LLM-DOCUMENTATION-CHECKLIST.md): The **universal, generic documentation checklist and prompt specification**.
  * Use this file as a system prompt, task context, or pre-commit verification checklist whenever introducing new features, UI components, REST API endpoints, business modules, or architecture specifications.
  * Enforces the 5 architectural invariants, Diátaxis framework, British English editorial standards, OpenAPI standards (E1–E17, S1–S8), and all automated quality gates.

---

## How to Feed This Prompt to an LLM

When prompting an AI assistant or scheduling a Jules session, include the following instruction:

```markdown
Read and strictly adhere to `agent-prompts/LLM-DOCUMENTATION-CHECKLIST.md`.
Follow the Monorepo Architectural Invariants, Diátaxis framework typing, and the domain-specific checklist for your changes (UI, API, Architecture, or Operations).
Before concluding your task, execute and pass all automated pre-commit verification gates:
1. pnpm run arch-check
2. pnpm nx run landing:arch-docs-check
3. pnpm nx run landing:docs-check
4. pnpm nx build landing
5. pnpm nx run-many -t build typecheck
```

---

## Key Quality Gates Reference

| Gate | Command | Purpose |
| :--- | :--- | :--- |
| **Architecture Fitness** | `pnpm run arch-check` | Enforces Python import contracts (import-linter) and TypeScript module boundaries. |
| **Architecture Docs Gates** | `pnpm nx run landing:arch-docs-check` | Validates Mermaid diagrams, frontmatter schemas, MADR structure, and 12/12 arc42 coverage. |
| **Documentation Gates** | `pnpm nx run landing:docs-check` | Enforces 16 documentation quality gates (link checks, British spelling, demos, MDX safety). |
| **Static Site Generation** | `pnpm nx build landing` | Verifies static compilation across all routes. |
| **TypeScript Compilation** | `pnpm nx run-many -t build typecheck` | Validates TypeScript type safety across the monorepo. |
