# 19 – Checklist verification (every component, every check, with evidence)

## Role

You are an independent compliance reviewer for the design system. You weren't involved in prompts
01–18. Their entries in `PROGRESS.md` say what was intended; you prove what was actually done.

For **every** public component and widget, verify **every** checklist item and record the evidence.
A check passes only when you can point at the code, the test or the rendered page that proves it.
"Probably fine" is a fail.

## Read first

- `STANDARDS.md`, in full
- `PROGRESS.md`, every entry: note each recorded exception and decision, because an accepted
  exception counts as a pass only if it has a reason
- `AUDIT.md` and `RELEASE-REVIEW.md`
- `packages/ui/CONTRIBUTING.md` (the component checklist)
- `03-library-actions-forms.md`, section "Component review checklist"
- `STANDARDS.md` §6 (page template, demos, status meanings)

## Step 1: build the inventory from the code, not from any list

Enumerate every exported symbol from `packages/ui/src/index.ts`, `src/charts/index.ts` and
`src/editor/index.ts`, following each re-export. Classify each symbol as:

- a **component** (renders UI)
- a **part** of a compound component (e.g. `DialogTitle`)
- a **hook**
- a **helper or function**
- a **type**

Group the parts under their component.

The verification unit is the component with all its parts. Widgets and charts are components too.
Record the count. If it differs from the counts in `AUDIT.md` or `PROGRESS.md`, explain the
difference.

## Step 2: automated checks

Write a script at `packages/ui/scripts/verify-checklist.mjs`, with an Nx target `ui:verify-checklist`.
It checks each component's source files mechanically and outputs JSON plus a Markdown table:

| ID | Check | How to verify mechanically |
| --- | --- | --- |
| C1 | `forwardRef` on every rendered component and part | AST: export wraps `forwardRef(...)`, or is the documented generic cast |
| C2 | `data-slot` on every rendered part | Every JSX root element in a component carries `data-slot` |
| C3 | `'use client'` exactly when hooks, context or handlers are used | Directive present ⇔ the file uses React hooks, `on*` handlers or context |
| C4 | Tokens only | No hex, `rgb(`, `hsl(` or `oklch(` literals, and no palette classes like `bg-blue-500` or `text-zinc-700`, in component files |
| C5 | `className` merged | `className` is destructured and passed through `cn(` or `mergeClassName(` |
| C6 | Rest props spread to the root | `...props` (or equivalent) is spread on the root element |
| C7 | React 17 safe | No `useId`, `useSyncExternalStore`, `useTransition`, `useDeferredValue`, `useInsertionEffect` or `use(` imported from `react` |
| C8 | No icon-package imports | No import of `lucide-react` or any other icon library inside `packages/ui/src` |
| C9 | TSDoc on every public prop, with `@default` where a default exists | From `dist/api.json`: every prop has a description. A prop whose destructuring has a default value has a `@default` tag |
| C10 | Component-level TSDoc with `@example` | `api.json` has a description for the component, and the source has an `@example` |
| C11 | Naming conventions | Controlled props follow `value`/`defaultValue`/`onValueChange` (or `open`, `checked`, `pressed`). Size props use only `sm`/`md`/`lg` (plus documented extras) |
| C12 | Hard-coded user-facing English is overridable | String literals rendered as text or `aria-label` come from a prop with a default (`labels`, a `*Label` prop or children). List any that don't |
| C13 | RTL safety | No physical `left`/`right`/`ml-`/`mr-`/`pl-`/`pr-` classes where a logical equivalent exists, unless justified by a comment |

Fill each cell with **pass**, **fail** (with the file and line) or **n/a** (with the reason). The
script must run on the whole library in under a minute.

## Step 3: evidence-based manual checks, per component

For each component, verify these by reading the tests, the docs page and the rendered site. Cite the
evidence (test file and test name, page URL and section, or `file:line`).

| ID | Check | Evidence required |
| --- | --- | --- |
| M1 | Built on Base UI where a primitive exists | The Base UI import, or a stated reason why none fits |
| M2 | Controlled **and** uncontrolled both work | The test names covering each |
| M3 | Accessible name and roles correct (WAI-ARIA pattern) | The test asserting the role and name; the pattern followed |
| M4 | Full keyboard support | The test names for each key in the page's keyboard table. Every key in the docs table must have a test |
| M5 | Form integration (form controls only) | Tests for `Field` labelling, `aria-invalid`, `name` submission, `disabled` and `readOnly` |
| M6 | Edge cases | Tests for empty, long text, boundary numbers and disabled, as relevant |
| M7 | Visual states in both themes, at 1280px and 360px | The `docs-e2e` run for the component's page passed. Name the screenshot baselines |
| M8 | Touch targets at least 24×24 CSS px | Measured in the browser for interactive parts (record the smallest) |
| M9 | Docs page follows the template in STANDARDS §6 | The URL. Each required section is present and non-trivial. The demos' source matches what runs |
| M10 | Every documented behaviour is tested | List each behaviour claim on the page next to its test. An untested claim is a fail |
| M11 | Every prop in the API table is demonstrated or explained on the page | The props neither shown nor explained count as a fail, unless they're truly self-explanatory (state which) |
| M12 | `status` is honest | Stable only if every check above passes (STANDARDS §6). Otherwise the page must say Beta or Experimental |
| M13 | Translation | Every user-facing string can be overridden (cross-check with C12), and the page documents how |
| M14 | Example data | Demos use the Northwind universe and the formats in STANDARDS §5 |

## Step 4: report

Write `agent-prompts/ui-docs-overhaul/CHECKLIST-REPORT.md` with:

1. **Summary**:
   - the components verified (count)
   - the overall pass rate per check
   - components fully compliant / with exceptions / failing
2. **Matrix**: one row per component, one column per check (C1–C13, M1–M14). Each cell is ✓, ✗ or
   n/a, and each ✗ links to its finding.
3. **Findings**: `CHK-001…`, with the component, the check, the evidence of failure, the fix, and
   the owner area (library, docs or tests).
4. **Accepted exceptions**: the ones recorded in `PROGRESS.md`. State whether each reason holds up.
   A reason that doesn't hold up becomes a finding.

## Step 5: fix, then re-verify

- Fix every finding. Follow the rules of the prompt that owns that area: library fixes per prompt
  03's checklist, page fixes per prompt 09's page procedure. Each library fix gets a regression test.
- Downgrade `status` where a component can't meet Stable in this pass, and record why. Never upgrade
  a status without the evidence.
- Rerun `ui:verify-checklist` and the manual checks you affected, until the matrix has no ✗ apart
  from documented, justified exceptions.
- Add `ui:verify-checklist` to CI, so the mechanical checks stay enforced.

## Definition of done

- `CHECKLIST-REPORT.md` covers every exported component with evidence for every check.
- Every finding is fixed or is a justified exception.
- `ui:verify-checklist` passes and runs in CI.
- Statuses are honest.
- STANDARDS §8 is met.
- End the report with one line: "All N components verified against C1–C13 and M1–M14: X fully
  compliant, Y with justified exceptions, 0 failing." If anything is still failing, give the true
  number instead of 0, and list it as blocking.
- Commit as `chore(ui): verify every component against the checklist`.
