# Prompt 9 — npm packaging readiness

## Context
`packages/ui` is meant to be published to npm as `@innostes/ui`. Tooling for validation is
already installed as dependencies but has **never been run**: `publint`, `@arethetypeswrong/cli`,
`size-limit`. There is also no `LICENSE` file despite `package.json` declaring
`"license": "MIT"`, and no `CHANGELOG.md`.

**Precondition:** run prompt 2 (full build) first — these tools inspect the built `dist/` output.

## Task

### 1. `publint`
Run it against the built package (check `publint`'s actual CLI invocation — likely
`pnpm exec publint packages/ui` or run from inside `packages/ui` — verify with `--help`, don't
guess). Fix every reported issue: common ones are missing `types` conditions in `exports`, a
`main`/`module` mismatch with `exports`, missing `sideEffects` declaration causing bundlers to not
tree-shake CSS-only files correctly, or a README/LICENSE field pointing at a nonexistent file.

### 2. `@arethetypeswrong/cli` (`attw`)
Run it against the built package (`pnpm exec attw --pack packages/ui` or equivalent — check
`--help`). This specifically checks that TypeScript consumers under every resolution mode (node10,
node16-cjs, node16-esm, bundler) actually resolve types correctly for BOTH entry points:
`@innostes/ui` and `@innostes/ui/charts`. Fix any reported resolution failures — these usually
mean the `exports` map's `types` condition ordering is wrong (types must come first in each
conditional block) or a `.d.ts` file is missing/misnamed relative to what `exports` claims.

### 3. `size-limit`
There's no config yet. Add a `size-limit` config (either in `package.json` under a `size-limit`
key, or `.size-limit.json`) with reasonable budgets for:
- The main `@innostes/ui` ESM entry (without charts) — exclude `recharts` since it's optional.
- The `@innostes/ui/charts` entry alone.
- The precompiled `styles.css` (for non-Tailwind consumers).
Pick budget numbers based on what the actual current build produces (measure first, then set the
budget slightly above current size, not an arbitrary round number) so the check is meaningful,
not immediately failing or completely toothless. Add a `size` script to `package.json` and wire
it as an Nx target if the project's existing target conventions expect that (check
`packages/ui/project.json` for how `build`/`typecheck` are wired, mirror that pattern).

### 4. `LICENSE`
Add `packages/ui/LICENSE` (standard MIT license text, copyright line using the project/org name —
check git log or package.json `author` field for the right name/year, don't invent one).

### 5. `CHANGELOG.md`
Add `packages/ui/CHANGELOG.md`. Since this package has never shipped, start it at an "Unreleased"
or `0.1.0` entry summarizing what's in this initial build: base component set, widgets layer,
charts entry point, React 17/18/19 support, the customization system (tokens/CSS
vars/className/classNames/render), fluid typography, container-query responsiveness. Keep it
honest and compact — this is a first release, not a long history.

### 6. `package.json` field audit
Re-read `packages/ui/package.json` in full and verify, now that there's a second entry point:
- `exports`: both `.` and `./charts` conditions present and correctly ordered (`types` first).
- `files`: includes everything actually needed at install time (dist output, LICENSE, README) and
  nothing extraneous (no src, no test files, no config files) — check against what `publint`
  flagged.
- `sideEffects`: correct for the CSS files (`tailwind.css`/`styles.css` must be marked as having
  side effects so bundlers don't drop them; JS modules should otherwise be side-effect-free for
  tree-shaking).
- `engines`: a sensible Node version floor matching what the build toolchain actually requires.
- `peerDependencies`/`peerDependenciesMeta`: confirm `react`/`react-dom` ranges still say
  `^17.0.0 || ^18.0.0 || ^19.0.0` and `recharts` is still marked `optional`.

## Definition of done
- [ ] `publint` reports zero errors (warnings reviewed and either fixed or consciously accepted
      with a one-line reason noted in this file's completion report).
- [ ] `attw --pack` reports no resolution failures for either entry point across all checked
      resolution modes.
- [ ] `size-limit` config exists, runs, and passes against current build output.
- [ ] `LICENSE` and `CHANGELOG.md` exist in `packages/ui`.
- [ ] `exports`/`files`/`sideEffects`/`engines`/`peerDependencies` all verified correct by reading
      the file, not assumed.
- [ ] Nothing is committed.
