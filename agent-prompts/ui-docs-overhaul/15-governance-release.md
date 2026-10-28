# 15 – Governance and release readiness

## Role

You are the engineering manager responsible for the design system's release process and public
policies. Enterprises adopt libraries whose policies are explicit, honest and followed. Write those
policies, put the release machinery behind them, and make the package metadata complete.

## Read first

- `STANDARDS.md`
- `PROGRESS.md`: every "API changes" entry and the bundle sizes
- `AUDIT.md`: the items owned by 15
- `packages/ui/package.json`, `packages/ui/README.md` and `packages/ui/CONTRIBUTING.md`
- `content/dev-docs/guides/releasing.mdx`, and how the repo versions packages today: check for Nx
  Release, Changesets or nothing

## Tasks

1. **Changelog**:
   - Create `packages/ui/CHANGELOG.md` in Keep a Changelog format.
   - Add an "Unreleased" section listing, from `PROGRESS.md` and git history, every new component and
     every API change made by this runbook, with migration notes for breaking ones.
   - Render it on a docs page under Resources.
   - Make sure the release tooling the repo uses updates it; if none is set up, document the manual
     step in `releasing.mdx`.
2. **Version**:
   - Decide the version to release this as. A library making semver promises shouldn't sit at
     `0.0.1`. Propose `1.0.0` (or a `1.0.0-rc` if prompt 18 later finds blockers), and record the
     reasoning.
   - The docs header must read the version from `package.json`.
   - Make sure every status badge matches STANDARDS §6.
3. **Policy pages** (under Resources):
   - **Versioning and support**:
     - semver rules: what counts as breaking for components, including visual changes, the DOM
       structure and `data-slot` names
     - the deprecation policy (warnings in development, how long before removal)
     - the support matrix: React 17, 18 and 19, the exact peer versions, the browsers (state the
       Browserslist target and back it with the build config), Node for SSR
     - the security support window
   - **Migration guides**: a template, plus the guide for this release's breaking changes, if there
     are any.
   - **Security**: how to report vulnerabilities (create `SECURITY.md` in the package and at the repo
     root), the XSS notes for `RichTextEditor` and `FileDropzone`, and the dependency policy.
   - **Contributing** (public-facing): the contribution process, linked to the internal
     `CONTRIBUTING.md` for code rules, with the component checklist summarised.
   - **FAQ**: real questions only. Use the troubleshooting topics from installation and the
     comparisons with other libraries.
   - **Licence**: make sure a `LICENSE` file exists in `packages/ui`, matching `package.json`, and
     that the docs footer shows it.
4. **Package metadata and README**:
   - `package.json`: `repository` (with `directory`), `homepage`, `bugs`, `author` or organisation,
     `funding` if applicable, accurate `keywords`, `engines`, `sideEffects` correctness, and
     `files` including `CHANGELOG.md`, `LICENSE` and the READMEs.
   - Rewrite `packages/ui/README.md` as the npm landing page:
     - one-sentence pitch in house voice
     - badges (npm version, licence, bundle size, CI). Only badges that will work.
     - install and quick start
     - entry points
     - links to the docs
     - the support matrix
     - no stale counts
5. **Bundle size**: add a size-limit check (or an equivalent) per entry point to CI, with budgets
   set slightly above today's measured sizes. Publish the numbers on the performance guide.
6. **Developer docs**: update `content/dev-docs/packages/ui.mdx` and `guides/releasing.mdx` for the
   new entry point, the compat-suite changes, the gates and the release process.

## Definition of done

- The changelog, policies, `SECURITY.md`, `LICENSE`, metadata and README are complete and accurate.
- Size checks are in CI.
- The version decision is recorded.
- `pnpm pack` in `packages/ui` produces a tarball containing exactly the intended files (list them in
  `PROGRESS.md`).
- `docs-check` passes.
- STANDARDS §8 is met.
- Commit as `chore(ui): release governance, policies and package metadata`.
