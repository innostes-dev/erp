'use client';

import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type DragEvent,
  type ReactNode,
} from 'react';
import { cn } from '../../../lib/cn';
import { FileIcon, UploadIcon, XIcon } from '../../../lib/icons';
import type { SlotClassNames } from '../../../lib/slots';
import { useControllableState } from '../../../lib/use-controllable-state';
import { useId } from '../../../lib/use-id';
import { Button } from '../../actions/button/button';
import {
  fileMatchesAccept,
  formatBytes,
  type FileRejection,
  type FileRejectionReason,
} from './file-utils';

export type FileDropzoneSlot = 'root' | 'zone' | 'icon' | 'title' | 'hint' | 'list' | 'file' | 'errors';

export interface FileDropzoneLabels {
  /** @default 'Drag files here or' */
  title?: ReactNode;
  /** @default 'Browse files' */
  browse?: ReactNode;
  /** @default (file) => `Remove ${file.name}` */
  remove?: (file: File) => string;
  /** Message for a rejected file. */
  rejection?: (rejection: FileRejection) => ReactNode;
}

export interface FileDropzoneProps
  extends Omit<ComponentProps<'div'>, 'defaultValue' | 'onChange' | 'children'> {
  /** The selected files (controlled). */
  value?: File[];
  /** The initial files (uncontrolled). @default [] */
  defaultValue?: File[];
  /** Called with the full list when files are added or removed. */
  onValueChange?: (files: File[]) => void;
  /** Called with the files that were dropped or picked but not accepted. */
  onReject?: (rejections: FileRejection[]) => void;
  /** Allowed types, like the native `accept`: `.pdf`, `image/*`, `application/pdf`. */
  accept?: string;
  /** Allow more than one file. @default true */
  multiple?: boolean;
  /** Largest allowed file, in bytes. */
  maxSize?: number;
  /** Most files allowed in total. */
  maxFiles?: number;
  /** Submits the files under this name when used in a `<form>`. */
  name?: string;
  /** Requires at least one file for native form validation. @default false */
  required?: boolean;
  /** Disables dropping and picking. @default false */
  disabled?: boolean;
  /** Small text under the title, e.g. "PDF or PNG, up to 5 MB". */
  hint?: ReactNode;
  /** Show the selected files under the zone. Turn off to render your own list. @default true */
  showFileList?: boolean;
  /** Show thumbnails for images in the file list. @default true */
  showPreviews?: boolean;
  /** Locale for file sizes. */
  locale?: string;
  /** Visible texts, for translation. */
  labels?: FileDropzoneLabels;
  /** Classes for inner parts. */
  classNames?: SlotClassNames<FileDropzoneSlot>;
}

const reasonText: Record<FileRejectionReason, string> = {
  type: 'type not allowed',
  size: 'file too large',
  count: 'too many files',
};

/**
 * A drop area for attaching files: invoices, receipts, contracts, CSV imports. Accepts drag
 * and drop or a "Browse" button, checks type, size and count, and lists the files with image
 * thumbnails. Backed by a real `<input type="file">`, so `name` submits the files with a form.
 *
 * @example
 * <FileDropzone
 *   name="receipts"
 *   accept="image/*,.pdf"
 *   maxSize={5_000_000}
 *   hint="PDF or images, up to 5 MB each"
 *   onValueChange={setFiles}
 * />
 */
export const FileDropzone = forwardRef<HTMLDivElement, FileDropzoneProps>(function FileDropzone(
  {
    value,
    defaultValue = [],
    onValueChange,
    onReject,
    accept,
    multiple = true,
    maxSize,
    maxFiles,
    name,
    required = false,
    disabled = false,
    hint,
    showFileList = true,
    showPreviews = true,
    locale,
    labels,
    className,
    classNames,
    id,
    ...props
  },
  ref,
) {
  const inputId = useId(id);
  const hintId = `${inputId}-hint`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useControllableState({ value, defaultValue, onChange: onValueChange });
  const [rejections, setRejections] = useState<FileRejection[]>([]);
  const [dragging, setDragging] = useState(false);
  // Bumped on every pick, so the input is re-synced even when nothing was accepted.
  const [picks, setPicks] = useState(0);
  const limit = multiple ? maxFiles : 1;

  // Mirror the list into the native input so a surrounding form submits it.
  useEffect(() => {
    const input = inputRef.current;
    if (!input || typeof DataTransfer === 'undefined') return;
    try {
      const transfer = new DataTransfer();
      files.forEach((f) => transfer.items.add(f));
      input.files = transfer.files;
    } catch {
      // Older browsers can't assign `files`; the list still works, only native submit is lost.
    }
  }, [files, picks]);

  const addFiles = (incoming: File[]) => {
    const accepted: File[] = [];
    const rejected: FileRejection[] = [];
    const base = multiple ? files : [];
    for (const file of incoming) {
      const reasons: FileRejectionReason[] = [];
      if (!fileMatchesAccept(file, accept)) reasons.push('type');
      if (maxSize !== undefined && file.size > maxSize) reasons.push('size');
      if (reasons.length === 0 && limit !== undefined && base.length + accepted.length >= limit) {
        reasons.push('count');
      }
      if (reasons.length) rejected.push({ file, reasons });
      else accepted.push(file);
    }
    setRejections(rejected);
    if (rejected.length) onReject?.(rejected);
    if (accepted.length) setFiles([...base, ...accepted]);
  };

  const removeFile = (file: File) => {
    setFiles(files.filter((f) => f !== file));
    setRejections([]);
  };

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setDragging(true);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    event.preventDefault();
    setDragging(false);
    addFiles(Array.from(event.dataTransfer.files));
  };

  const rejectionText =
    labels?.rejection ??
    ((r: FileRejection) => `${r.file.name}: ${r.reasons.map((x) => reasonText[x]).join(', ')}`);

  return (
    <div
      ref={ref}
      data-slot="file-dropzone"
      className={cn('flex w-full flex-col gap-3', classNames?.root, className)}
      {...props}
    >
      <div
        data-slot="file-dropzone-zone"
        data-dragging={dragging ? '' : undefined}
        data-disabled={disabled ? '' : undefined}
        data-invalid={rejections.length ? '' : undefined}
        onDragEnter={onDragOver}
        onDragOver={onDragOver}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
        }}
        onDrop={onDrop}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input bg-background px-6 py-8 text-center transition-colors',
          'has-[input:focus-visible]:border-ring',
          'data-dragging:border-primary data-dragging:bg-primary/5',
          'data-invalid:border-destructive',
          'data-disabled:cursor-not-allowed data-disabled:opacity-50',
          classNames?.zone,
        )}
      >
        <span
          data-slot="file-dropzone-icon"
          className={cn('flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground', classNames?.icon)}
        >
          <UploadIcon className="size-5" />
        </span>
        <p data-slot="file-dropzone-title" className={cn('text-sm text-foreground', classNames?.title)}>
          {labels?.title ?? 'Drag files here or'}{' '}
          <Button
            variant="link"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            aria-describedby={hint ? hintId : undefined}
          >
            {labels?.browse ?? 'Browse files'}
          </Button>
        </p>
        {hint && (
          <p id={hintId} data-slot="file-dropzone-hint" className={cn('text-xs text-muted-foreground', classNames?.hint)}>
            {hint}
          </p>
        )}
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          name={name}
          accept={accept}
          multiple={multiple}
          required={required && files.length === 0}
          disabled={disabled}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
          onChange={(e) => {
            const picked = Array.from(e.currentTarget.files ?? []);
            if (picked.length) addFiles(picked);
            setPicks((n) => n + 1);
          }}
        />
      </div>

      {rejections.length > 0 && (
        <ul role="alert" data-slot="file-dropzone-errors" className={cn('flex flex-col gap-1 text-sm text-destructive', classNames?.errors)}>
          {rejections.map((r, i) => (
            <li key={`${r.file.name}-${i}`}>{rejectionText(r)}</li>
          ))}
        </ul>
      )}

      {showFileList && files.length > 0 && (
        <ul data-slot="file-dropzone-list" className={cn('flex flex-col gap-2', classNames?.list)}>
          {files.map((file, i) => (
            <FileRow
              key={`${file.name}-${file.size}-${file.lastModified}-${i}`}
              file={file}
              preview={showPreviews}
              locale={locale}
              removeLabel={labels?.remove?.(file) ?? `Remove ${file.name}`}
              onRemove={disabled ? undefined : () => removeFile(file)}
              className={classNames?.file}
            />
          ))}
        </ul>
      )}
    </div>
  );
});

function FileRow({
  file,
  preview,
  locale,
  removeLabel,
  onRemove,
  className,
}: {
  file: File;
  preview: boolean;
  locale?: string;
  removeLabel: string;
  onRemove?: () => void;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const isImage = preview && file.type.startsWith('image/');

  useEffect(() => {
    if (!isImage || typeof URL.createObjectURL !== 'function') return;
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file, isImage]);

  return (
    <li
      data-slot="file-dropzone-file"
      className={cn('flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2', className)}
    >
      <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-muted text-muted-foreground">
        {url ? <img src={url} alt="" className="size-full object-cover" /> : <FileIcon className="size-4" />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{file.name}</span>
        <span className="text-xs text-muted-foreground">{formatBytes(file.size, locale)}</span>
      </span>
      {onRemove && (
        <Button variant="ghost" size="sm" iconOnly aria-label={removeLabel} onClick={onRemove}>
          <XIcon />
        </Button>
      )}
    </li>
  );
}
