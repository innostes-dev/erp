# RichTextEditor

The `RichTextEditor` component is a professional WYSIWYG (What You See Is What You Get) surface for creating formatted content. It provides a standard toolbar for text styling, lists, and links.

## Features

- **Full Formatting Toolbar**: integrated support for Bold, Italic, Underline, Headers (H1-H3), Lists, and Links.
- **Controlled & Uncontrolled**: Seamless integration with `value` or `defaultValue`.
- **Character Counter**: Real-time counter reporting with `maxLength` restriction support.
- **Custom Toolbar**: Configure exactly which `toolbarButtons` are visible.
- **Insert Link Handler**: Override the default prompt with `onInsertLink` to use your own custom URL picker.
- **Sanitization**: Integrated `sanitize` hook to strip dangerous HTML before rendering.
- **Accessibility**: Built with `contentEditable` and proper WAI-ARIA `textbox` attributes.
- **Validation Integrated**: Automatic `error` and `success` states with helper text slots.

## Installation

```bash
import { RichTextEditor } from '@luxis-ui/react';
```

## Usage

### Basic Usage

```tsx
import { RichTextEditor } from '@luxis-ui/react';

const App = () => (
  <RichTextEditor 
    label="Blog Post Content" 
    placeholder="Start sharing your thoughts..."
    onChange={(html, text) => console.log('HTML:', html)}
  />
);
```

### With Character Limit

```tsx
<RichTextEditor 
  label="Signature"
  maxLength={200}
  showCount
  minHeight={100}
  hideToolbar={true} // Simple text only
/>
```

### Advanced Toolbar Config

```tsx
<RichTextEditor 
  toolbarButtons={['bold', 'italic', 'unorderedList', 'link', 'clearFormat']}
  onInsertLink={(callback) => {
    const url = myCustomUrlPicker();
    callback(url);
  }}
/>
```

## API Reference

### RichTextEditor Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `value` | `string` | - | HTML string for controlled mode. |
| `onChange` | `(html, text) => void`| - | Fired on every keystroke. |
| `label` | `string` | - | Header text. |
| `placeholder` | `string` | - | "Ghost" text when empty. |
| `maxLength` | `number` | - | Limit of visible characters. |
| `showCount` | `boolean` | `false` | Display character counter. |
| `minHeight` | `number` | `200` | Minimum vertical space in pixels. |
| `hideToolbar` | `boolean` | `false` | Hides the formatting buttons. |
| `toolbarButtons`| `ToolbarButton[]`| `[all]` | List of allowed actions. |
| `sanitize` | `(html) => string` | - | Custom hook to clean incoming HTML. |

### Toolbar Actions

`bold`, `italic`, `underline`, `strikethrough`, `h1`, `h2`, `h3`, `orderedList`, `unorderedList`, `link`, `alignLeft`, `alignCenter`, `alignRight`, `code`, `clearFormat`, `undo`, `redo`.

## CSS Classes

| Selector | Description |
| :--- | :--- |
| `.lxs-richtext-container` | Main editor box with toolbar. |
| `.lxs-richtext-editor` | The actual `contentEditable` area. |
| `.lxs-richtext-toolbar` | The top button group. |
| `.lxs-richtext-toolbar-button`| Individual utility button. |
| `.lxs-richtext-counter` | The character count display. |
| `.lxs-richtext-error` | Style applied during validation failure. |
