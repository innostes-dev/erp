# innostes ERP: architecture documentation runbook

These prompts produce architecture documentation for the ERP application to recognised industry
standards. It must be accurate against the code, kept in the repo with the code ("docs as code"),
and enforced by automated checks where a rule can be checked.

**Audience**: engineers joining the team, module authors, operators who deploy and run the system,
security reviewers, and architects evaluating the platform.

**Standards used** (details in [`STANDARDS.md`](./STANDARDS.md)):

| Standard | Used for |
| --- | --- |
| [arc42](https://arc42.org) (template v8) | The structure of the architecture documentation: 12 sections |
| [C4 model](https://c4model.com) | Diagrams: system context, containers, components, plus deployment and dynamic views |
| [MADR](https://adr.github.io/madr/) 4.x | Architecture decision records (ADRs) |
| [Diátaxis](https://diataxis.fr) | Keeping explanation, reference, how-to and tutorial pages apart |
| ISO/IEC 25010 | The quality attribute vocabulary, for quality goals and scenarios |
| OWASP threat modelling with STRIDE | The security view: data flows, trust boundaries, threats, mitigations |
| ISO/IEC/IEEE 42010 (lightweight) | Stakeholders and their concerns, mapped to views |

**Related runbooks**: `agent-prompts/ui-docs-overhaul` (UI library docs) and `agent-prompts/api-docs`
(HTTP API reference). This runbook links to those docs and doesn't duplicate them.

Run the prompts **in order, each in a fresh agent session**, from the repository root.

## Before you start

1. Commit your work. Agents work on the branch `docs/architecture`; prompt 01 creates it.
2. Agents need permission to run `pnpm`, `git` (local only), Python, Docker (for the deployment
   views; optional) and the docs dev server.

## How to run each prompt

```text
Read agent-prompts/architecture-docs/STANDARDS.md and agent-prompts/architecture-docs/PROGRESS.md in
full, then carry out agent-prompts/architecture-docs/01-audit.md exactly. Do not stop until its
Definition of done is met and you have appended your entry to PROGRESS.md and committed.
```

If an entry lists **blocking** issues, rerun the same prompt with: "Continue <prompt>. Resolve the
blocking items in your previous PROGRESS.md entry."

## Order

| # | Prompt | arc42 section | Result |
| --- | --- | --- | --- |
| 01 | [Audit](./01-audit.md) | all | Claims verified, gaps against arc42, candidate ADRs. Nothing fixed |
| 02 | [Tooling and fitness functions](./02-tooling-fitness-functions.md) | – | Diagram rendering, doc gates, architecture rules enforced by tests |
| 03 | [Context, goals and strategy](./03-context-goals-strategy.md) | 1–4 | Stakeholders, quality goals, constraints, system context (C4 level 1), solution strategy |
| 04 | [Building blocks](./04-building-blocks.md) | 5 | Container and component views, the plug-in contract, the module catalogue |
| 05 | [Runtime view](./05-runtime-view.md) | 6 | Sequence diagrams for the key scenarios |
| 06 | [Data architecture](./06-data-architecture.md) | 5 and 8 | Generated entity diagrams, multi-tenancy, audit and soft delete, migrations |
| 07 | [Deployment and operations](./07-deployment-operations.md) | 7 | Deployment views, configuration reference, runbooks |
| 08 | [Cross-cutting concepts and security](./08-crosscutting-security.md) | 8 | Authentication and authorisation, errors, logging, and so on; the STRIDE threat model |
| 09 | [Architecture decision records](./09-adrs.md) | 9 | MADR template, plus records for the decisions already in the code |
| 10 | [Quality, risks and glossary](./10-quality-risks-glossary.md) | 10–12 | Quality scenarios, risk and debt register, glossary |
| 11 | [Developer docs alignment](./11-devdocs-alignment.md) | – | Getting started, guides and structure aligned, with no duplication |
| 12 | [QA and editorial](./12-qa-editorial.md) | – | Diagrams, links, claims, voice |
| 13 | [Checklist verification](./13-checklist-verification.md) | all | Every page, diagram and ADR proven against the checklists |

## Files

- `STANDARDS.md`: rules, page structure and checklists (`A*` pages, `D*` diagrams, `R*` ADRs,
  `F*` fitness functions).
- `PROGRESS.md`: the shared log.
- `AUDIT.md` (01) and `CHECKLIST-REPORT.md` (13): the evidence before and after.
