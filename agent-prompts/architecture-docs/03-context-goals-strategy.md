# 03 – Introduction and goals, constraints, context and scope, solution strategy (arc42 §1–4)

## Role

You are the lead architect. Write the pages that orient every reader: what the system is for, who
cares about it and why, what limits the design, where its boundaries are, and the few fundamental
choices everything else follows from.

## Read first

`STANDARDS.md`, `PROGRESS.md`, `AUDIT.md` (the recovered architecture, the candidate ADRs and the
items owned by 03), and the existing `overview.mdx`.

## Pages (in `content/dev-docs/architecture/`)

1. **Architecture index** (`index.mdx`):
   - how this documentation is organised (arc42 sections mapped to pages, as a table)
   - the C4 levels used
   - where the ADRs are
   - how to keep the docs up to date (the docs-as-code rules and the gates)
   - links to the API reference and the UI docs
2. **Introduction and goals** (§1):
   - The requirements overview: what the ERP does today, from the modules that exist. Separate it
     from the intended scope, marked as planned.
   - The **top three to five quality goals**, using ISO/IEC 25010 terms (for example modifiability
     through plug-ins, security, maintainability, operability). Each one gets a sentence on why it
     matters for this product. Detailed scenarios come in prompt 10.
   - **Stakeholders**: a table of role, concern and the views and pages that answer it (the 42010
     idea). For example: module author, platform engineer, operator, security reviewer, front-end
     developer, integrator.
3. **Constraints** (§2): technical (languages, frameworks, Postgres, supported React versions,
   Python version, monorepo tooling), organisational (team, repo and release process) and
   conventions (the coding standards documents). **List only constraints that are evidenced** (in
   config, docs or code). Put anything you think should be a constraint but isn't evidenced (for
   example data-protection obligations) under "Open questions for the product owner". Never assert
   regulatory obligations as facts.
4. **Context and scope** (§3):
   - The **C4 system context diagram**: the ERP system; its users (roles that exist in the code);
     and its external systems (the SMTP server for email, the Postgres database if you treat it as
     external at this level, the browser). Include only real integrations.
   - A **business context table**: each actor or system with its inputs and outputs.
   - A **technical context**: the protocols and channels (HTTPS/JSON API, SMTP, SQL), with a mapping
     table.
5. **Solution strategy** (§4): a short page. It lists the fundamental decisions (the plug-in
   architecture with two engines, the kernel as the first plug-in, the technology choices,
   multi-tenancy, soft delete and audit by default, the API documented from code), each linked to its
   ADR (prompt 09 writes them; use stable planned URLs and coordinate in `PROGRESS.md`). It also
   shows how they serve the quality goals, as a goals-to-approach table.

## Rules

- Rework `overview.mdx`: its content moves into these pages and into prompt 04's building-block
  view. Leave redirects, or keep the URL as the index, so existing links work. Record the moves.
- Diagrams follow D1–D7. Pages follow A1–A10.

## Definition of done

- The §1–4 pages exist and pass the checklists. The gates pass.
- The open questions for the product owner are listed in `PROGRESS.md`.
- Commit as `docs(arch): context, goals, constraints and solution strategy`.
- STANDARDS §7 is met.
