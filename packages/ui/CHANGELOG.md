# Changelog

All notable changes to the `@innostes/ui` package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Ongoing maintenance and experimental features for future minor versions.

## [1.0.0] - 2026-10-29

### Added
- **5 new composite widgets**:
  - `ActivityFeed`: Audit log and timeline streams with relative timestamping.
  - `EntityList`: Compact master-list view for enterprise data navigation.
  - `QuickActions`: Role-based command palette action strip.
  - `WelcomeBanner`: Dismissible role-aware onboarding hero banner.
  - `ActionList`: Keyboard-navigable action rows with badge tags.
- **Dedicated modular entry points**:
  - `@innostes/ui/charts`: High-level Cartesian and Donut chart visualisations powered by Recharts with OKLCH theme tokens.
  - `@innostes/ui/editor`: Rich text editor powered by Tiptap with formatting toolbars and validation states.
- **Enterprise primitives hardened on Base UI**:
  - Complete ARIA labelling, keyboard navigation, and roving tabindex on `Button`, `ButtonGroup`, `Toggle`, `ToggleGroup`, `Field`, `Input`, `Textarea`, `Checkbox`, `RadioGroup`, `Switch`, `Select`, `Combobox`, `NumberField`, `Slider`.
  - Floating overlays: `Dialog`, `AlertDialog`, `Sheet`, `Popover`, `Tooltip`, `DropdownMenu`, `ContextMenu` supporting logical start/end positioning and RTL mirroring.
  - Data display & navigation: `DataTable` with server-side sorting/pagination, `Table`, `Card`, `Stat`, `Badge`, `Avatar`, `EmptyState`, `Kbd`, `Tabs`, `Breadcrumb`, `Pagination`, `Accordion`, `Collapsible`, `Sidebar`, `PageHeader`, `SplitPane`.
- **Theme tokens & Dark mode**:
  - Semantic OKLCH color scale with APCA/WCAG 2.1 AA compliant contrast.
  - Zero-runtime CSS variables with `@innostes/ui/tailwind.css`, `@innostes/ui/theme.css`, and `@innostes/ui/dark.css`.
  - Standalone precompiled stylesheet `@innostes/ui/styles.css` for consumers without Tailwind CSS.
- **Multi-React Runtime Compatibility**:
  - Fully tested and verified across React 17, React 18, and React 19 test environments.
- **TSDoc & Machine-Readable Metadata**:
  - Comprehensive British English docstrings across all exported component props.
  - Machine-readable `dist/api.json` extracted from TSDoc for automated documentation.

### Changed
- Promoted library to stable SemVer `1.0.0`.
- Clamped `Progress` and `Meter` percentage bounds strictly between 0 and 100 with localized `aria-valuetext` formatters.
- Updated `Breadcrumb` active state resolution to prevent spurious navigation warnings; non-terminal items default to links while current item renders text with `aria-current="page"`.
- Aligned `Dialog` and `Sheet` positioning props to logical CSS attributes (`side="start" | "end"`).
- Re-architected `DataTable` column definitions to use canonical `id` and `cell` render functions.
- Renamed notification bell component to `NotificationBell` exported from `@innostes/ui`.

### Security
- Created formal vulnerability disclosure process with dedicated contact (`security@innostes.com`) and 48-hour initial response SLA.
- Added strict XSS sanitization guidance for `RichTextEditor` HTML output using DOMPurify.
- Implemented file type and size validation policies in `FileDropzone`.
