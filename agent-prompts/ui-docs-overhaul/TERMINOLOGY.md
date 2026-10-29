# Terminology sheet

This terminology sheet establishes authoritative choices for concepts across `@innostes/ui` documentation, TSDoc comments, and developer guides. One preferred term per concept must be used consistently.

| Preferred term | Deprecated / Disallowed alternatives | Context & Rationale |
| :--- | :--- | :--- |
| **overlay** | popup, modal window, popup window | Generic term for floating layers positioned above page content (Dialog, Sheet, Popover, Menu). |
| **dialog** | modal, popup | Specific accessible component implementing `role="dialog"`. |
| **alert dialog** | confirm modal, prompt | Specific accessible component implementing `role="alertdialog"` requiring explicit user action. |
| **sheet** | drawer, flyout, slide-out | Side overlay anchoring to viewport edges (left, right, top, bottom). |
| **popover** | dropdown popup, hover card | Floating panel tied to a trigger without blocking background interaction. |
| **select** (verb/noun) | pick, choose, dropdown picker | Choosing an option from a list. Use `Select` for the component. |
| **disabled** | inactive, greyed-out, off | State where a control cannot receive focus or user interaction (`aria-disabled` or `disabled`). |
| **prop** (plural: **props**) | property, parameter, argument | React component attribute/input in documentation prose and tables. |
| **property** | prop | Reserved exclusively for CSS properties (e.g. `color property`, `display property`) or object properties in TypeScript definitions. |
| **right-to-left (RTL)** | RTL (without first definition), bidi | Spell out on first use in any page: "right-to-left (RTL)". Subsequent uses may use RTL. |
| **component names in prose** | PascalCase in prose without backticks | Use backticked code spans for exported symbols (`DataTable`, `Button`, `Dialog`), or lowercase normal words in prose ("the data table displays...", "the button triggers..."). Never bare `DataTable` without code formatting. |
| **colour** | color | British English spelling in all documentation prose, guides, and TSDoc. Keep `color` only in code identifiers/CSS. |
| **behaviour** | behavior | British English spelling in all documentation prose, guides, and TSDoc. |
| **customise / customisation** | customize / customization | British English spelling in all documentation prose, guides, and TSDoc. |
| **organisation** | organization | British English spelling in all documentation prose, guides, and TSDoc. |
| **centre / centred** | center / centered | British English spelling in all documentation prose, guides, and TSDoc. Keep `center` only in CSS properties (e.g. `items-center`). |
| **grey** | gray | British English spelling in prose. Keep `gray` only in Tailwind classes (e.g. `text-gray-500`) when referencing upstream tokens. |
| **licence** (noun) / **license** (verb) | license (as noun in prose) | In British English: "under the MIT licence", but "licensed under MIT". |
| **trigger** | activator, opener, button | The interactive element that opens an overlay or popover. |
| **dismiss** | close out, cancel out, dismiss away | Action of closing an overlay via Escape, backdrop click, or close button. |
| **data table** (prose) / `DataTable` (code) | grid, spreadsheet | Tabular data display with sorting, filtering, and selection. |
| **Northwind Traders Pvt Ltd** | Acme, FooCorp, Example Inc | Sole authorised business entity for mock data and scenario illustrations. |
