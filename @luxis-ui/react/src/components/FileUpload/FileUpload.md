# FileUpload

The `FileUpload` component provides a professional drag-and-drop interface for uploading files. It features live progress tracking, file type validation, image previews, and a manageable file list.

## Features

- **Drag & Drop**: Large, interactive dropzone with visual feedback during drag operations.
- **Multiple Files**: Support for selecting and uploading multiple files simultaneously.
- **File Validation**: Integrated checks for `maxSize` and `accept` (MIME/extensions) with automatic error reporting.
- **Previews**: Automatic generation of round thumbnails for image files.
- **Progress Tracking**: Real-time progress bars for each file during the upload process.
- **Manageable List**: View pending/completed files with the ability to remove them individually.
- **Custom Icons**: Override default file icons with specialized ones based on extensions.
- **Accessible**: Full keyboard support (Enter/Space to trigger browse) and ARIA attributes for status reporting.

## Installation

```bash
import { FileUpload } from '@luxis-ui/react';
```

## Usage

### Basic Usage

```tsx
import { FileUpload } from '@luxis-ui/react';

const App = () => (
  <FileUpload
    label="Upload Document"
    accept=".pdf, .docx"
    maxSize={5242880} // 5MB
    onUpload={(files) => console.log('Uploading:', files)}
    helperText="Max file size 5MB. Only PDF or DOCX allowed."
  />
);
```

### Multiple Image Uploads

```tsx
<FileUpload
  multiple
  accept="image/*"
  onUpload={(files) => handleImages(files)}
  label="Gallery Images"
/>
```

### Initial File State

```tsx
<FileUpload
  initialFiles={[
    { id: '1', file: existingFile, status: 'success', progress: 100 }
  ]}
/>
```

## API Reference

### FileUpload Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `label` | `string` | - | Header text for the upload field. |
| `accept` | `string` | - | Allowed file types (e.g., `'image/*, .zip'`). |
| `multiple` | `boolean` | `false` | Allow picking more than one file. |
| `maxSize` | `number` | - | Limit file size in bytes. |
| `onUpload` | `(files: FileItem[]) => void` | - | Callback when files are selected/started. |
| `onRemove` | `(id: string) => void` | - | Callback when a file is deleted from list. |
| `initialFiles`| `FileItem[]` | `[]` | Pre-populate the file list. |
| `helperText` | `string` | - | Support text below the field. |
| `error` | `string` | - | Error message/state for the field. |
| `disabled` | `boolean` | `false` | Prevents interaction. |

### FileItem Object

| Key | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique identifier. |
| `file` | `File` | The native File object. |
| `status` | `'uploading'\|'success'\|'error'` | Current lifecycle stage. |
| `progress` | `number` | Percentage of completion (0-100). |
| `previewUrl` | `string` | Generated blob URL for image previews. |
| `error` | `string` | specific validation/upload error message. |

## CSS Classes

| Selector | Description |
| :--- | :--- |
| `.lxs-fileupload-wrapper` | Root component container. |
| `.lxs-fileupload-dropzone` | The main interactive box. |
| `.lxs-fileupload-dropzone--active`| Style applied during drag-over. |
| `.lxs-fileupload-list` | Container for the uploaded file rows. |
| `.lxs-fileupload-item` | Individual file entry row. |
| `.lxs-fileupload-item__progress` | The status bar background. |
