'use client';

import { FileDropzone } from '@innostes/ui';

export default function FileDropzoneDemo() {
  return (
    <FileDropzone
      className="w-full max-w-lg"
      name="receipts"
      accept="image/*,.pdf"
      maxSize={5_000_000}
      maxFiles={5}
      hint="PDF or images, up to 5 MB each, 5 files max"
    />
  );
}
