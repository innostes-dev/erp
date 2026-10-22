# React compatibility tests

`@innostes/ui` supports React 17, 18 and 19. The main test suite (`pnpm nx test ui`) runs on
React 19. These projects run the **same tests** against the **built** package on older React
versions, installed the way a consumer app would:

| Project | React | Command |
| --- | --- | --- |
| `tests/ui-react17` | 17.0.2 | `pnpm nx run-many -t test typecheck -p ui-react17-tests` |
| `tests/ui-react18` | 18.3.1 | `pnpm nx run-many -t test typecheck -p ui-react18-tests` |

- `test` runs `packages/ui/src/components/**/*.test.tsx` against `packages/ui/dist`, with every
  `react` / `react-dom` / Base UI import resolved to this project's copies.
- `typecheck` checks the same test files, and the published `.d.ts` files, against that React
  version's types.

Both build `ui` first. Run everything with `pnpm nx run-many -t test typecheck`.
