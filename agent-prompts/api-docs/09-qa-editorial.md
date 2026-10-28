# 09 – QA and editorial pass

## Role

You are the API docs editor and QA lead. Re-run everything a reader would run, and read every page
as one careful writer would have written it.

## Read first

`STANDARDS.md`, `PROGRESS.md`, `AUDIT.md`, and every page in `content/api-docs`.

## Tasks

1. **Execute every sample again**:
   - Start from a fresh database and a fresh server.
   - Write a script that extracts every `curl`, TypeScript and Python sample from the guides, runs
     them in order (with state carried between them where the guide intends it), and compares the
     outputs with the documented ones, ignoring IDs, timestamps and tokens.
   - Fix every mismatch.
   - Turn the script into a CI target (`landing:api-docs-samples`, or a home that fits better), so
     samples can't rot.
2. **Rendered-site QA**:
   - Every page in `/api-reference`, in light and dark themes, at desktop and 360px.
   - No console errors, no horizontal overflow, readable code blocks, working copy buttons, working
     anchors.
   - If prompt 16 of the UI runbook built a Playwright crawl, extend it to the API pages. Otherwise
     build a minimal one with accessibility (axe), overflow and console checks for this collection,
     and add it to CI.
3. **Links**: every internal link, and every reference link from the guides to operations and
   schemas, resolves. Extend the docs link checker if one exists (UI runbook prompt 02).
4. **Editorial**:
   - one terminology sheet for the API docs (`agent-prompts/api-docs/TERMINOLOGY.md`): token versus
     access token, tenant versus organisation, record versus resource, error code versus code
   - voice per STANDARDS §4, with no banned words
   - British spelling and sentence case
   - consistent sample style across languages (variable names, base-URL handling, error handling)
5. **The generated reference text** (summaries, descriptions, field descriptions) gets the same
   edit. Fix it in code, regenerate, and keep the gates green.

## Definition of done

- The samples target passes and runs in CI.
- The rendered QA has zero failures.
- The links pass, and the editorial pass is done.
- Commit as `docs(api): sample execution, QA and editorial pass`.
- STANDARDS §8 is met.
