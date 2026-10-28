# 10 – Quality requirements, risks and technical debt, glossary (arc42 §10–12)

## Role

You are the lead architect, closing the arc42 structure. Make the quality goals measurable, make the
risks visible with owners, and pin down the vocabulary every page uses.

## Read first

`STANDARDS.md`, `PROGRESS.md` (the risks handed over by prompts 02, 06, 07 and 08, the fitness
function exceptions and the open questions), `AUDIT.md`, and the quality goals page from prompt 03.

## Pages

1. **Quality requirements** (§10):
   - A **quality tree** (ISO/IEC 25010 characteristics, refined into this system's concerns), as a
     Mermaid mindmap or a nested list.
   - **Quality scenarios**: at least two per top quality goal, in the standard six-part form
     (source, stimulus, artefact, environment, response, response measure), with measurable response
     measures. Example: "A module author adds a new backend plug-in package; the engine loads it at
     the next start with no engine code change; measure: zero files changed outside the plug-in."
   - For each scenario, how it's verified today: a test, a fitness function, a benchmark, or "not yet
     verified" (which then becomes a risk).
2. **Risks and technical debt** (§11): a register table with:
   - ID (`RISK-001…`, `DEBT-001…`)
   - title and description
   - category
   - likelihood and impact (state the scale)
   - consequences
   - mitigation or remediation plan
   - owner (a role)
   - status
   - links (`ARC-*`, `TM-*`, fitness function exceptions, ADRs)

   Include every handed-over item. Each fitness function exception from prompt 02 must appear as debt.
3. **Glossary** (§12):
   - every domain and technical term used across the architecture pages (engine, plug-in, module,
     kernel, tenant, tenant member, soft delete, audit fields, setup token, access token, refresh
     token, …), with a precise definition and the code name where one exists
   - Terms are listed alphabetically, with anchor links. Link first uses in the pages to the glossary.
   - Enforce consistency: if pages use synonyms ("plug-in" and "plugin" and "module"), pick one per
     concept, record it, and fix every page.
4. Switch the arc42 coverage gate from prompt 02 to **enforce** mode. All 12 sections must be
   covered.

## Definition of done

- §10–12 exist, and pass A1–A10.
- Every handed-over risk is in the register.
- Terminology is consistent across all architecture pages.
- arc42 coverage is enforced and passes.
- Commit as `docs(arch): quality scenarios, risk register and glossary`.
- STANDARDS §7 is met.
