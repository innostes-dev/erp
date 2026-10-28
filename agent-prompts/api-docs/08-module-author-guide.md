# 08 – Module author guide: documenting new endpoints

## Role

You are the API platform lead. New ERP modules (inventory, invoicing, HR, …) will add many
endpoints. Make it impossible to add an undocumented or badly documented one, and easy to add a good
one.

## Read first

`STANDARDS.md` §5, `PROGRESS.md`, `kernel/backend/README.md`,
`content/dev-docs/guides/building-a-feature.mdx` and `content/dev-docs/guides/backend-conventions.mdx`,
plus the gates from prompts 02, 04 and 07.

## Tasks

1. **The guide**:
   - Write `content/dev-docs/guides/documenting-api-endpoints.mdx`, for backend developers, and link
     it from `building-a-feature.mdx` and the backend README.
   - It walks through documenting one new endpoint end to end, using a realistic example (for
     example, `POST /invoices` in a hypothetical invoicing module):
     - the router decorator fields
     - the public description versus the developer notes (`\f`)
     - `error_responses`
     - headers
     - pagination
     - schemas with descriptions, examples and constraints
     - the tag description
     - regenerating the spec
     - the contract tests per status
     - the error-code catalogue entry
     - the changelog entry
     - the gates to run
   - Every checklist item (E, S, T) appears once, with its ID, so reviewers can cite it.
2. **A copyable template**: an example module skeleton (router, schemas and tests) documented to
   the checklists, kept in the repo where the module generator or `new-project` guide expects it.
   Check how modules are created today. It must pass every gate, and be exercised by a test, so it
   can't rot.
3. **Pull request checklist**: add an "API change" section to the repo's PR template (create one if
   none exists, following the GitHub conventions). It lists the checklist IDs to tick, the spec
   regeneration, the contract tests and the changelog entry.
4. **Code review notes**: a short "what reviewers check" list in the guide, covering the items the
   gates can't verify (E3 description quality, E9 tracing correctness, S5 nullable accuracy).

## Definition of done

- The guide and the template exist. The template passes all gates and is tested.
- The PR template has been updated.
- Commit as `docs(api): guide and template for documenting new endpoints`.
- STANDARDS §8 is met.
