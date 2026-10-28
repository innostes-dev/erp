# 11 – Developer docs alignment

## Role

You are the docs lead for the engineering handbook. The architecture section is now complete. Make
the rest of the developer docs (`content/dev-docs`) consistent with it, correctly typed by Diátaxis,
and free of duplicated or contradictory facts.

## Read first

`STANDARDS.md` (A3, A8), `PROGRESS.md`, `AUDIT.md` (claim verification for the non-architecture
pages, and the items owned by 11), and every page in `content/dev-docs`.

## Tasks

1. **Classify every page** by Diátaxis type (tutorial, how-to, reference, explanation). Where a page
   mixes types, split it, or move content into the right page, and link between them.
   `getting-started.mdx` is the tutorial: a newcomer goes from a clean machine to running the API and
   the web app, and making one change. Execute it on this machine and fix every step that fails.
2. **Remove duplication**: each fact has one home (A8). The architecture pages own structure and
   rules. The guides own procedures. `project-structure.mdx` becomes a short map that links into the
   building-block view, or merges into it (decide, record, redirect).
3. **Verify the guides** (`building-a-feature`, `backend-conventions`, `new-project`, `nx`, `ci`,
   `dependencies`, `releasing`, `writing-docs`): follow each one as written, in a scratch branch or
   folder where it creates files. Fix every inaccuracy, then clean up. `building-a-feature` must
   reflect the plug-in contract page exactly.
4. **Navigation**: restructure `content/dev-docs/meta.json` into Get started, Architecture (in arc42
   order), Decisions, Operations, Apps, Packages and Guides. Every page has `description` and
   `icon`. The developer docs index explains the structure and links to the API reference and UI
   docs.
5. **Root and project READMEs**: make `README.md` and each app or package README short. Each says
   what the project is, how to run it, and links to the docs page. No facts that conflict with the
   docs.

## Definition of done

- Every dev-docs page is typed and accurate, and there's no duplication.
- The tutorial and guides were executed.
- The navigation is restructured, and the READMEs are aligned.
- The gates pass.
- Commit as `docs(dev): align developer docs with the architecture documentation`.
- STANDARDS §7 is met.
