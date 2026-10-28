# 09 – Architecture decision records (arc42 §9)

## Role

You are the architecture review board's secretary and an architect. Set up the decision log, and
record the significant decisions already embodied in the code. Be honest about what is and isn't
known.

## Read first

`STANDARDS.md` (R1–R9 are your spec), `PROGRESS.md` (the planned ADR URLs used by prompts 03–08),
`AUDIT.md` § "Candidate ADRs", and the MADR 4 template at https://adr.github.io/madr/. If you can't
fetch it, use the section list in R1.

## Tasks

1. **Template and process**:
   - `architecture/decisions/0000-template.mdx` (excluded from numbering checks, or handled by the
     gate) with every MADR section and short guidance comments.
   - An `index.mdx` decision log, with a table generated from frontmatter (number, title, status,
     date, superseded by).
   - A process page (or a section in `guides/architecture-docs.mdx`): when an ADR is needed, who
     decides, proposed → accepted, superseding, and that ADRs are changed through pull requests,
     together with the code.
2. **Frontmatter schema** for ADRs: `status`, `date`, `deciders`, `supersedes`, `supersededBy` and
   `tags`. Extend the gate from prompt 02.
3. **Retroactive ADRs**: one per significant decision in the audit's candidate list, numbered in a
   logical order (foundations first). For each one:
   - **Context**: the forces as they are evident in the code and the repo.
   - **Considered options**: realistic alternatives a team in this position would have weighed. Label
     them as alternatives, not as history, unless commits or docs show they were actually
     considered.
   - **Decision outcome** and **consequences**: good and bad, as they show up in the code today
     (cite examples).
   - **Confirmation**: the fitness function, test or review that checks compliance (R5).
   - **Status**: "accepted (recorded retroactively on <date>)". If the original rationale isn't
     recorded anywhere, say exactly that (R4). Invented rationale is a critical defect.
   - Use `git log` and `git blame` on the relevant files to find dates and context.
4. **Proposed ADRs**: for open architecture questions surfaced by prompts 03–08 (for example
   enforcing tenant isolation at the database level, a page-registry design for frontend plug-ins,
   API versioning), write ADRs with the status **proposed**, presenting the options without deciding.
   List them for the user in `PROGRESS.md`.
5. **Link everything**: replace the planned ADR links in prompts 03–08's pages with the real ones,
   and make sure each ADR links back to the pages it affects (R7).

## Definition of done

- The template, index, process and every retroactive and proposed ADR exist, and pass R1–R9.
- The gates pass.
- No architecture page has a broken ADR link.
- Commit as `docs(arch): decision log and retroactive ADRs`.
- STANDARDS §7 is met.
