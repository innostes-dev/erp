# Innostes Business OS: Compatibility Test Suites

This directory contains standalone, isolated runtime compatibility test suites for **@innostes/ui** and the **Innostes Business Operating System (Business OS)**.

`@innostes/ui` supports **React 17, 18, and 19**. While the monorepo dev runtime runs React 19 (`pnpm nx test ui`), these standalone test workspaces execute the exact same component unit tests against pre-compiled production distributions (`packages/ui/dist`) using isolated React versions installed exactly as a consumer application would.

---

## 1. Test Matrix

| Project Workspace | React Target | Execution Command |
| :--- | :--- | :--- |
| `tests/ui-react17` | React 17.0.2 | `pnpm nx run-many -t test typecheck -p ui-react17-tests` |
| `tests/ui-react18` | React 18.3.1 | `pnpm nx run-many -t test typecheck -p ui-react18-tests` |

---

## 2. Test Execution Details

- **`test`**: Executes all `packages/ui/src/components/**/*.test.tsx` tests against the built `packages/ui/dist` bundle, with all `react`, `react-dom`, and Base UI imports resolved to the specific workspace's target React version.
- **`typecheck`**: Verifies both the test sources and published `.d.ts` declaration maps against the target React version's type definitions.

### Running Monorepo Compatibility Checks

```bash
# Build UI bundle and run tests across all React versions
pnpm nx run-many -t test typecheck
```

---

## 3. License

Open-source software licensed under the **[MIT License](../LICENSE)**.
