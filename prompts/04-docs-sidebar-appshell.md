# Prompt 4 — Docs: Sidebar customization + app-shell components

## Context
Docs site is `apps/landing`, Fumadocs-powered. Conventions to copy exactly:
- Page: `content/docs/components/<category>/<name>.mdx` (or `content/docs/widgets/<name>.mdx`),
  frontmatter `title`, `description`, `icon` (a valid `lucide-react` icon name — verify it resolves,
  past mistakes used `FormInput`/`AlignLeft` which don't exist; use e.g. `RectangleEllipsis`,
  `TextAlignStart` style names), `status: Stable`, `summary`.
- Body opens with `<ComponentPreview name="<category>/<name>/basic" />`, then `## Import`,
  `## Usage` (real guidance, not filler), `## API Reference` with
  `<ApiTable components={['ComponentName', ...]} />` for every exported component in that file.
- Demo file(s): `components/demos/<category>/<name>/basic.tsx` — a real, working React component
  using `@innostes/ui` imports, default-exported, that `ComponentPreview` renders live and also
  shows as source.
- Add every new page to the relevant `content/docs/**/meta.json` `pages` array so it shows in the
  sidebar nav, in a sensible position.
- `apps/landing/content/docs/components/layout/meta.json` already lists `sidebar` — that page may
  already exist as a basic stub; check before assuming you're creating it from nothing.

**Precondition:** `packages/ui` build should be green (prompt 2) so `ApiTable`'s `dist/api.json`
reflects the real current props.

## Task — write/rewrite these pages

1. **`content/docs/components/layout/sidebar.mdx`** — THE most important page (directly answers
   "can they customize design of sidebar? completely"). Must cover:
   - `SidebarProvider` props: `open`, `defaultOpen`, `onOpenChange`, `keyboardShortcut`,
     `mobileQuery`, `width`, `iconWidth`, `mobileWidth` (document that these map to
     `--sidebar-width`, `--sidebar-width-icon`, `--sidebar-width-mobile` CSS vars — show a demo
     setting a custom width).
   - `Sidebar` props: `side` (`left`/`right`), `variant` (`sidebar`/`floating`/`inset`),
     `collapsible` (`icon`/`offcanvas`/`none`) — a demo (or a few small demos) showing at least one
     of each variant.
   - Full part list with a nav-with-submenu demo: `SidebarHeader`, `SidebarContent`,
     `SidebarFooter`, `SidebarSeparator`, `SidebarGroup`, `SidebarGroupLabel`, `SidebarGroupAction`,
     `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton` (`size`, `activeIndicator`),
     `SidebarMenuAction`, `SidebarMenuBadge`, `SidebarMenuSub`/`SidebarMenuSubItem`/
     `SidebarMenuSubButton`, `SidebarTrigger`, `SidebarRail`, `SidebarInset`, and the `useSidebar()`
     hook.
   - A "Theming the sidebar" section: the dedicated `--color-sidebar*` token set in
     `packages/ui/tailwind/theme.css`/`dark.css` is independent from the rest of the app — show how
     to override those tokens to theme just the shell.
   - `<ApiTable components={['SidebarProvider','Sidebar','SidebarMenuButton', ...]} />` covering
     every exported piece.

2. **`content/docs/components/layout/app-rail.mdx`** (new) — `AppRail`, `AppRailItem` (icon,
   label, isActive, badge, showLabel, render prop), `AppRailHeader`/`AppRailFooter`/
   `AppRailSeparator`. Demo should mirror the icon-rail pattern from the HRMS reference screenshot
   — rail + sidebar used together (can reuse/adapt the sidebar demo).

3. **`content/docs/components/layout/top-bar.mdx`** (new) — `TopBar`, `TopBarStart`,
   `TopBarCenter`, `TopBarEnd`, and the `--top-bar-height` CSS var for custom height.

4. **`content/docs/components/overlays/command-palette.mdx`** (new) — `CommandPalette`,
   `CommandItem`/`CommandGroup` types, default hotkey (`k`, i.e. Cmd/Ctrl+K), the `filter` function
   prop for custom matching, and the `classNames` slot prop (`popup`, `input`, `list`,
   `groupHeading`, `item`, `empty`, `footer`). Demo must be interactive (trigger button + palette).

5. **`content/docs/widgets/app-switcher.mdx`** (new) — `AppSwitcher`, `AppSwitcherApp`,
   `AppSwitcherSection` types. This is the "ECOSYSTEM" module launcher from the reference
   screenshot — say so, and demo with 3-4 fake apps (ERP, HRMS, CRM, etc.).

6. **`content/docs/widgets/notification-bell.mdx`** (new) — `NotificationBell`,
   `NotificationList`, `NotificationItem`.

7. **`content/docs/widgets/user-menu.mdx`** (new) — `UserMenu`.

8. Update every affected `meta.json` (`components/layout`, `components/overlays`, `widgets`) to
   include the new page slugs in the sidebar nav.

9. Update the site header/nav (wherever `/ui`, `/ui/docs`, `/docs` cross-links live, per earlier
   work this project — find it by searching for existing nav link components in `apps/landing`)
   if any of these new sections need a top-level link; usually just the sidebar nav is enough, but
   check.

## Definition of done
- [ ] All 7 pages above exist, render, and actually describe the real current props (cross-check
      against the component source, not guesswork).
- [ ] Every demo file compiles and renders without console errors — run the docs site
      (`pnpm nx dev landing` or the project's actual dev target) and visually check each new page.
- [ ] `<ApiTable>` on each page resolves (no missing-component errors) — this requires
      `packages/ui`'s `dist/api.json` to be up to date; regenerate via its docs script if stale.
- [ ] Nav `meta.json` files updated so every new page is reachable from the sidebar.
- [ ] `pnpm nx run-many -t build typecheck -p landing` still passes.
- [ ] Nothing is committed.
