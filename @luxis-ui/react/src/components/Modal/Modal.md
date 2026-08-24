# Modal

The `Modal` component is a high-level overlay dialog used to capture user attention or facilitate focused interactions. It includes a backdrop, focus management, and flexible content slots.

## Features

- **Portal Rendering**: Automatically renders into `document.body` to avoid z-index and clipping issues.
- **Focus Control**: Built-in trap to keep tab navigation inside the modal while open.
- **Scroll Management**: Prevents body scrolling while active.
- **Keyboard Support**: Integrated "Escape" key closure.
- **Flexible Slots**: Dedicated `header` and `footer` props, or use `footerButtons` for automated button layouts.
- **Responsive Sizing**: Presets for `sm`, `md`, `lg`, `fullscreen`, and `auto`.
- **Animations**: Multiple entry effects: `fade`, `slide-up`, `slide-down`, and `zoom`.
- **Scrollable Content**: Optional internal scrolling for long dialogues.

## Installation

```bash
import { Modal } from '@luxis-ui/react';
```

## Usage

### Simple Confirmation

```tsx
import { Modal } from '@luxis-ui/react';

const App = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="Delete Account"
      description="This action is permanent and cannot be undone."
      footerButtons={[
        { label: 'Cancel', onClick: () => setIsOpen(false), variant: 'outline' },
        { label: 'Delete', onClick: handleDelete, variant: 'danger' },
      ]}
    >
      <p>Please enter your password to confirm deletion.</p>
    </Modal>
  );
};
```

### Fullscreen Modal

```tsx
<Modal
  isOpen={isOpen}
  onClose={close}
  size="fullscreen"
  animation="slide-up"
  title="New Message"
>
  <ComposeEmailForm />
</Modal>
```

### Custom Header/Footer

```tsx
<Modal
  isOpen={isOpen}
  onClose={close}
  header={<div className="custom-header">...</div>}
  footer={<div className="custom-footer">...</div>}
>
  {/* Children only */}
</Modal>
```

## API Reference

### Modal Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `isOpen` | `boolean**` | **Required** | Controls visibility. |
| `onClose` | `() => void**` | **Required** | Fired on backdrop/ESC/close click. |
| `title` | `string` | - | Header text. |
| `description` | `string` | - | Sub-text below title. |
| `size` | `'sm'\|'md'\|'lg'\|'fullscreen'\|'auto'`| `'md'` | Width preset. |
| `animation` | `'fade'\|'slide-up'\|'slide-down'\|'zoom'\|'none'` | `'fade'` | Entry transition. |
| `footerButtons`| `ModalFooterButton[]`| - | Generates standard actions. |
| `scrollable` | `boolean` | `false` | Enables vertical scrolling for body. |
| `centered` | `boolean` | `true` | Vertically centers the modal. |
| `closeOnBackdropClick`| `boolean`| `true` | Allows closing by clicking outside. |

### ModalFooterButton Object

| Key | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `label` | `string` | **Required** | Button text. |
| `onClick` | `() => void` | **Required** | Click callback. |
| `variant` | `string` | `'secondary'` | Visual button style. |
| `loading` | `boolean` | `false` | Shows spinner. |

## CSS Classes

| Selector | Description |
| :--- | :--- |
| `.lxs-modal` | Main dialog container. |
| `.lxs-modal-backdrop` | The darkened overlay. |
| `.lxs-modal-header` | Header slot wrapper. |
| `.lxs-modal-body` | Main children container. |
| `.lxs-modal-footer` | Footer actions wrapper. |
| `.lxs-modal-close` | The header close button. |
