# 17 – Editorial pass

## Role

You are the managing editor of a major design system's documentation. Many agents wrote these pages.
Your job is to make them read as if one careful senior writer wrote all of them: consistent, precise,
and free of anything that sounds generated or promotional.

## Read first

- `STANDARDS.md` §5 and §6. They are your style guide, and you apply them with judgement, not only
  mechanically.
- `PROGRESS.md`, for the decisions on terminology and casing
- `writing-docs.mdx`

## Process

1. **Build a terminology sheet** first (`agent-prompts/ui-docs-overhaul/TERMINOLOGY.md`), from what
   the pages actually use. One term per concept. For example: "popup" versus "popover" versus
   "overlay"; "select" versus "pick"; "disabled" versus "inactive"; "prop" versus "property";
   "right-to-left" versus "RTL" (spell it out on first use); component names in prose (`DataTable` in
   code spans versus "data table" in prose). Choose deliberately, and add the sheet to
   `writing-docs.mdx`.
2. **Read every page in `content/docs`**, top to bottom, in the rendered site, not only the source.
   For each page:
   - **Accuracy spot check**: pick at least two claims per page and verify them against the code.
   - **Voice**: remove the banned words and patterns, filler, hedging, marketing tone and restated
     headings. Shorten long sentences. Make the first sentence of every page and section carry the
     most important fact.
   - **Consistency**:
     - terminology from the sheet
     - British spelling
     - sentence case
     - punctuation (en dashes, ellipses, curly quotes)
     - the same phrasing for the same situation across pages (for example, how every page introduces
       "When not to use")
   - **Example data**: Northwind universe only, with names, money and IDs in the formats from
     STANDARDS §5.
   - **Cross-links**: each page links to its alternatives and related guides; there are no orphan
     pages; link text is descriptive (never "click here" or "this page").
   - **Code**: consistent style across snippets (import order, quotes, semicolons per the repo's
     Prettier config), with no unused imports or ellipses that would break copy-paste.
3. **Switch the `docs-check` prose spelling rule to enforce mode**, and fix everything it flags.
4. **Read the TSDoc** in `packages/ui/src` with the same standard. It feeds the API tables. Edit the
   descriptions only, never behaviour, and rebuild `api.json`.
5. **Developer docs** (`content/dev-docs`): the same editorial pass, aimed at contributors.

## Definition of done

- Every page and the TSDoc read consistently against the terminology sheet and the voice rules.
- The prose lint is in full enforce mode and passes.
- A list of the substantive accuracy fixes you made is in `PROGRESS.md`.
- STANDARDS §8 is met.
- Commit as `docs(ui): editorial pass for voice, terminology and consistency`.
