# 16 – Browser QA: automated crawl and fixes

## Role

You are the QA lead. Static checks can't see what users see. Build an automated browser crawl of the
whole docs site, which is also the library's largest visual test suite. Make it a CI gate, and fix
everything it finds.

## Read first

- `STANDARDS.md`
- `PROGRESS.md`
- `AUDIT.md`
- `apps/landing/package.json`
- the CI workflows

## Build the crawl

1. Add Playwright and `@axe-core/playwright` as **dev dependencies of the docs app**, or of a new
   `apps/landing-e2e` project if the Nx conventions in this repo prefer that. Check how the other
   e2e projects are set up.
2. The crawl builds and starts the docs site, then discovers every page from `sitemap.xml`. For
   **every page**, in **light and dark** themes, at **1280×800 and 360×740**, it checks:
   - no console errors or warnings, and no failed requests
   - no `axe` violations (WCAG 2.2 A and AA rules), including `color-contrast`
   - no horizontal page overflow (`document.scrollingElement.scrollWidth <= innerWidth`)
   - no broken images
   - every `ComponentPreview` renders and isn't empty
   - all in-page anchors resolve
3. **Keyboard smoke tests** for each interactive demo type: Tab reaches the demo; overlays open with
   the keyboard and close with `Escape`, and focus returns; menus are navigable with arrow keys.
   Write one parametrised test per component family rather than per page.
4. **Visual regression**: screenshots of every component's lead demo, in both themes and both
   widths, as baselines. Keep them in the repo, or in the store this repo uses for snapshots, so
   later changes show diffs. Document how to update the baselines.
5. Add an Nx target `docs-e2e` on the `landing` project (or on the e2e project, then use that project name in every command) and a CI job. On failure, the report must name the page, theme,
   viewport and rule.

## Fix everything it finds

- Fix each failure at its root:
  - library bugs in `packages/ui`, with a regression unit test
  - demo or page bugs in `apps/landing`
- Contrast failures are token problems. Fix them in `tailwind/theme.css` or `dark.css`, and re-verify
  the generated contrast table from prompt 08.
- Record every fix against an `AUDIT.md` ID, or a new one.

## Also check by hand (record the results honestly)

- Keyboard-only walk-through of: Installation, DataTable, Dialog, Select, DatePicker, KanbanBoard,
  RichTextEditor, and two examples.
- Screen-reader spot checks, if a screen reader is available on this machine (NVDA on Windows).
  Never claim a check you didn't run.
- `prefers-reduced-motion`: the animations are reduced.
- Zoom to 200%: no content lost (WCAG 1.4.4), and reflow at 320 CSS px (1.4.10).

## Definition of done

- `docs-e2e` runs every page in both themes and both viewports with zero failures, and is in CI.
- The visual baselines are committed and documented.
- The manual checks are recorded.
- STANDARDS §8 is met.
- Commit as `test(docs): browser crawl with accessibility, overflow and visual checks`, plus the
  fix commits.
