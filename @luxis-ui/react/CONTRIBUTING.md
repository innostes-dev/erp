# Contributing to Luxis UI

Thank you for your interest in contributing to Luxis UI!

This project is maintained by [Innostes Solutions](https://innostes-solutions.com) and
is open to contributions from the community under the [MIT License](./LICENSE). Whether
you're fixing a bug, proposing a new component, improving docs, or writing tests —
every contribution matters.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)
- [Commit Message Format](#commit-message-format)
- [Coding Standards](#coding-standards)
- [New Component Checklist](#new-component-checklist)

---

## Code of Conduct

By participating in this project you agree to abide by our
[Code of Conduct](./CODE_OF_CONDUCT.md). Please read it before contributing.

---

## Getting Started

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | `>= 18.0.0` |
| pnpm | `>= 8.0.0` |
| Git | latest |

### Fork and Clone

```bash
# 1. Fork the repo on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/luxis-ui.git
cd luxis-ui

# 2. Add the upstream remote
git remote add upstream https://github.com/innostes-solutions/luxis-ui.git

# 3. Install dependencies
pnpm install

# 4. Start Storybook for component development
pnpm dev

# 5. Run tests
pnpm test
```

---

## Project Structure

```
luxis-ui/
├── packages/
│   └── luxis-ui/
│       └── src/
│           ├── [component-name]/       # One folder per component
│           │   ├── index.ts            # Named re-exports only
│           │   ├── ComponentName.tsx   # Component implementation
│           │   └── ComponentName.test.tsx
│           └── theme/                  # ThemeProvider + token system
│               ├── ThemeProvider.tsx
│               ├── tokens.ts
│               ├── cssVariables.ts
│               ├── base.css
│               └── index.ts
├── app/
│   └── storybook/
│       └── src/stories/               # One .stories.ts per component
├── docs/                              # Docusaurus documentation site
└── package.json
```

---

## Development Workflow

### Working on a Bug Fix

```bash
# Always branch from main
git checkout main
git pull upstream main
git checkout -b fix/button-focus-ring
```

### Working on a New Component

```bash
git checkout -b feat/tooltip-component
```

### Running Tests

```bash
pnpm test          # Run all tests once
pnpm test:watch    # Watch mode
pnpm test:coverage # Coverage report
```

### Running Storybook

```bash
pnpm dev   # Opens Storybook at http://localhost:6006
```

### Building the Package

```bash
pnpm build         # Full build
pnpm build:types   # Type declarations only
```

---

## Submitting a Pull Request

1. **Keep PRs focused** — one bug fix or one feature per PR. Large PRs are hard to review.
2. **Fill in the PR template** — describe what changed, why, and how to test it.
3. **Pass all checks** — CI must be green before review. This includes lint, tests, and build.
4. **Add tests** — every bug fix needs a regression test. Every new feature needs unit tests.
5. **Update docs** — if you changed a public API, update the relevant MDX file in `docs/`.
6. **Reference issues** — if your PR closes an issue, add `Closes #123` in the PR body.

### PR Title Format

Follow the same format as commit messages (see below):

```
feat(tooltip): add keyboard dismiss on Escape
fix(button): correct focus ring in high contrast mode
docs(theme): update dark mode SSR example
```

---

## Reporting Bugs

Open a [GitHub Issue](https://github.com/innostes-solutions/luxis-ui/issues/new?template=bug_report.md) and include:

- Luxis UI version
- React version
- Framework (Next.js, Vite, CRA, etc.)
- Minimal reproduction (CodeSandbox or StackBlitz link preferred)
- Expected vs actual behavior
- Screenshots or screen recordings if relevant

> **Security vulnerabilities** must NOT be reported as public GitHub Issues.
> Please follow our [Security Policy](./SECURITY.md).

---

## Requesting Features

Open a [GitHub Issue](https://github.com/innostes-solutions/luxis-ui/issues/new?template=feature_request.md) and include:

- What problem does this solve?
- What would the API look like? (props, usage example)
- Is this a new component, a new prop on an existing one, or a theme change?
- Alternatives you have considered

---

## Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org):

```
<type>(<scope>): <short summary>

[optional body]

[optional footer: Closes #123]
```

**Types:**

| Type | When to use |
|------|-------------|
| `feat` | New component, new prop, new feature |
| `fix` | Bug fix |
| `docs` | Documentation changes only |
| `style` | Formatting, missing semicolons — no logic change |
| `refactor` | Code change that is neither a fix nor a feature |
| `test` | Adding or updating tests |
| `chore` | Build process, dependency updates, CI config |
| `perf` | Performance improvement |
| `a11y` | Accessibility improvement |

**Scope** is the component or area affected: `button`, `theme`, `tokens`, `docs`, etc.

**Examples:**

```
feat(select): add multi-select support
fix(input): remove double border in Firefox
docs(dark-mode): add SSR cookie example
chore(deps): upgrade React to 18.3
a11y(modal): trap focus correctly on open
```

---

## Coding Standards

### TypeScript

- No `any`. Use `unknown` and narrow with type guards if needed.
- Always type component props with an explicit interface, not inline.
- Export types separately from implementations.
- Use `React.forwardRef` for all components that render a DOM element.

```tsx
// ✅ Correct
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', ...props }, ref) => {
    return <button ref={ref} {...props} />;
  }
);
Button.displayName = 'Button';
```

### CSS

- Use `--lxs-*` CSS variables for every visual value. No hardcoded colors, spacing, or radii.
- Use `[data-theme='dark']` for dark mode variants — never JavaScript conditionals on style.
- Respect `prefers-reduced-motion` for all animations.

```css
/* ✅ Correct */
.button {
  background: var(--lxs-color-primary-500);
  padding: var(--lxs-spacing-2) var(--lxs-spacing-4);
  border-radius: var(--lxs-radius-md);
  transition: background var(--lxs-transition-fast);
}

@media (prefers-reduced-motion: reduce) {
  .button { transition: none; }
}
```

### Accessibility

- Every interactive component must be keyboard navigable.
- Use semantic HTML elements first. Add ARIA only when semantics are insufficient.
- Test with a screen reader before submitting any component PR.
- All text must meet WCAG 2.1 AA contrast ratio (4.5:1 for normal text, 3:1 for large).

### Exports

- Named exports only. No default component exports.
- Re-export types separately in `index.ts`.

```ts
// ✅ Correct
export { Button } from './Button';
export type { ButtonProps } from './Button';

// ❌ Wrong
export default Button;
```

---

## New Component Checklist

Before opening a PR for a new component, verify all items:

**Implementation**
- [ ] Component is in `packages/luxis-ui/src/[component-name]/`
- [ ] `React.forwardRef` used — ref forwarded to the root DOM element
- [ ] All visual values use `--lxs-*` CSS variables
- [ ] `prefers-reduced-motion` respected in all animations
- [ ] `...rest` props spread onto the root element
- [ ] `displayName` set on the component

**TypeScript**
- [ ] Props interface exported from `index.ts`
- [ ] No `any` types
- [ ] All props have JSDoc comments

**Accessibility**
- [ ] Keyboard navigable
- [ ] ARIA attributes correct
- [ ] Screen reader tested
- [ ] Focus visible in all states

**Tests**
- [ ] Unit tests in `ComponentName.test.tsx`
- [ ] Covers default render, all variants, keyboard interaction, and ref forwarding

**Storybook**
- [ ] Story file in `app/storybook/src/stories/`
- [ ] `argTypes` defined for all props
- [ ] All variants have a story
- [ ] `play` function for interactive stories

**Documentation**
- [ ] MDX file added to `docs/components/`
- [ ] Props table complete
- [ ] At least one live code example
