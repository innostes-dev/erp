# 03 – Library: actions and forms

## Role

You are a senior design-system engineer. You own the correctness of these components, and an
enterprise depends on them for every data-entry screen. Make each one correct, consistent,
accessible, documented in TSDoc, and tested to the level of a mature open-source library. Docs pages
come later (prompt 09). This prompt changes the **library**.

## Read first

- `STANDARDS.md` (especially §2, §4 and §7)
- `PROGRESS.md`
- `AUDIT.md`: every `LIB-*` item whose owner prompt is 03
- `packages/ui/CONTRIBUTING.md`
- the Base UI docs bundled at `packages/ui/node_modules/@base-ui/react/docs/react/components/*.md`,
  for each primitive you wrap

## Scope

- `packages/ui/src/components/actions/**`: Button, ButtonGroup, Toggle, ToggleGroup
- `packages/ui/src/components/forms/**`: Calendar, Checkbox, CheckboxGroup, Combobox, DatePicker
  (and the date-range presets), Field (and its parts), Fieldset, FileDropzone, Form, Input,
  InputGroup, Label, LocaleSelect, NumberField, RadioGroup, SearchableSelect, Select, Slider, Switch,
  TagInput, Textarea
- shared helpers in `src/lib` that these use

## Component review checklist (prompts 04–06 reuse this list)

For **each** component, read its source, its tests and the Base UI part it wraps, then check:

1. **Contract**: follows every rule in `CONTRIBUTING.md`. Root `ref` forwarded. Rest props spread
   to the root. `className` merged the right way (`cn` or `mergeClassName`). `data-slot` on every
   part. `'use client'` only where needed.
2. **API consistency across the category**:
   - the same names for the same concepts (`size`, `disabled`, `readOnly`, `invalid`, `required`,
     `name`, `placeholder`, `labels`, `classNames`, `onValueChange`)
   - controlled and uncontrolled both work
   - callbacks receive what the conventions page says they receive
   - no prop that does nothing
   - list the inconsistencies, decide one convention, and apply it everywhere
3. **Forms integration**:
   - works inside `Field`: label, description and error are wired, `aria-invalid` and `required`
     propagate
   - submits under `name` in a native `<form>`
   - `Form` validation works
   - `disabled` and `readOnly` behave and look distinct
4. **Accessibility**:
   - matches the WAI-ARIA Authoring Practices pattern
   - accessible name required where needed (and the TSDoc says so)
   - focus visible
   - keyboard complete
   - right-to-left correct (arrow keys, icons, logical properties)
   - no ARIA that duplicates native semantics
   - touch targets at least 24×24 CSS px (WCAG 2.2 target size)
5. **Internationalisation**: no hard-coded English in output without a `labels` or children override.
   Numbers and dates via `Intl` with a `locale` prop where it's relevant.
6. **Edge cases**:
   - empty, very long and non-Latin text
   - `0`, negative and decimal values
   - min greater than max
   - rapid repeated input
   - controlled value not updated by the parent
   - unmount during async work
   - SSR (no `window` at import time)
7. **Visual**:
   - tokens only
   - the `sm`/`md`/`lg` heights line up with Button, Input and Select in one row
   - focus ring, invalid and disabled styles are consistent across every control
   - dark theme correct
8. **TSDoc**:
   - every public prop has an accurate description and `@default`
   - the component comment says what it is, when to use it, and has a minimal correct `@example`
   - British English
   - `api.json` reflects it (rebuild and inspect)
9. **Tests** (behaviour, not class names):
   - roles and names
   - keyboard
   - controlled and uncontrolled
   - form submission
   - `Field` integration
   - disabled and read-only
   - every bug you fix gets a regression test
   - every documented behaviour has a test

## Specific items known to need attention

- `TagInput`, `FileDropzone` and `RichTextEditor` are new (Beta). `FileDropzone` should integrate
  with `Field` errors, not only render its own error list. Decide the design and document it.
- `LocaleSelect`, `DatePicker` and `Calendar`: verify `locale` handling and first day of week
  end to end, including RTL locales.
- Check that `Select`, `Combobox`, `SearchableSelect` and `TagInput` share item styling, empty
  state, size scale and clear behaviour.

## Out of scope

Docs pages and demos, except where a demo breaks because of an API change you made. Update that demo
minimally and note it.

## Definition of done

- Every component in scope passes the checklist, or has a recorded exception in `PROGRESS.md` with a
  reason.
- Every in-scope `LIB-*` item in `AUDIT.md` is fixed or justified.
- Every API change is listed in `PROGRESS.md`.
- Test coverage for `src/components/actions` and `src/components/forms` is at least 90% of lines
  (`pnpm nx test ui --coverage`), with no meaningless tests written to reach the number.
- STANDARDS §8 is met.
- Commit as `fix(ui): harden action and form components`, or split into several focused commits.
