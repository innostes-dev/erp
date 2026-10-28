# 09 – Component pages: actions and forms

## Role

You are a senior technical writer who is also a strong React engineer. You write component pages that
developers trust and bookmark: complete, exact, and full of realistic examples they can paste into an
ERP screen.

## Read first

- `STANDARDS.md`: §5 (voice, example data) and §6 (page template, demos) are your spec
- `PROGRESS.md`: the decisions from prompts 03 and 07, and every API change
- `AUDIT.md`: the `DOC-*` items owned by 09
- `content/dev-docs/guides/writing-docs.mdx`, for the building blocks available after prompt 07
- the component source and tests for every component you document: the code is the source of truth,
  not the old page

## Scope

Pages under `content/docs/components/actions/` and `content/docs/components/forms/`, and their demos
under `components/demos/actions/` and `components/demos/forms/`.

## Page procedure (prompts 10–12 reuse this)

For **each** component:

1. Read the component source, TSDoc, tests and the Base UI part it wraps. List every prop and every
   behaviour a developer would need to know.
2. Rewrite the page to the template in STANDARDS §6, in that section order:
   - **When to use** names the alternatives and links to them.
   - **Examples** cover the real scenarios, each as its own demo file with its source shown:
     variants, sizes, every state, controlled use, use inside `Field` and `Form` with validation,
     and composition with neighbouring components.
3. **Accessibility** gets a `<KeyboardTable>` when the component handles keys. It says exactly what
   the developer must provide.
4. **Guidelines** use `<DoDont>`, with real content guidance: label wording, placeholder versus
   label, error message wording, when to disable versus hide.
5. **API reference** has `<ApiTable>` for every exported part, with `baseUi` set when it wraps Base
   UI. If a prop description is weak, fix the TSDoc in the library (a docs-only change to the
   library is allowed) and rebuild. Never paper over it in MDX.
6. Add a `<PropsPlayground>` on the pages of the most-used components: Input, Select, Checkbox,
   Switch, Toggle, and any other component where props interact.
7. Set `status` honestly, using STANDARDS §6.
8. Open the page in the dev server. Check every demo in light and dark themes at 1280px and 360px,
   and use the keyboard on it. Check the console.

## Content you must cover in this scope

- **Field and Form**:
  - the full validation story: native constraints, custom `validate`, async validation, server
    errors mapped onto fields, when errors show, and focusing the first invalid field on submit
  - one complete example of an ERP form (a purchase order header) built from the components
- **Select family**: one comparison table across Select, Combobox, SearchableSelect, TagInput and
  RadioGroup (when to choose each), linked from each of those pages.
- **DatePicker and Calendar**: ranges, presets, min and max, disabled dates, locale and first day of
  week, time zones (state plainly what the component does and doesn't handle).
- **FileDropzone**: the upload-with-progress pattern using `showFileList={false}`, and server-side
  validation notes.
- **NumberField**: currency and percent formatting in `en-IN`, and the min, max and step behaviour.

## Definition of done

- Every page in scope follows the template and passes `docs-check`, including the template check
  for these pages.
- Every demo meets STANDARDS §6.
- Every `DOC-*` item owned by 09 is fixed or justified.
- STANDARDS §8 is met, including the browser check.
- Commit as `docs(ui): rewrite action and form component pages`.
