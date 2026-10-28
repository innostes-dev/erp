'use client';

import { useState } from 'react';
import { FileDropzone, Progress, formatBytes } from '@innostes/ui';

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'completed';
}

export default function FileDropzoneUploadProgressDemo() {
  const [uploads, setUploads] = useState<UploadingFile[]>([]);

  const handleFiles = (files: File[]) => {
    const nextUploads: UploadingFile[] = files.map((file) => ({
      file,
      progress: 68,
      status: 'uploading',
    }));
    setUploads(nextUploads);
  };

  return (
    <div className="flex w-full max-w-xl flex-col gap-4">
      <FileDropzone
        name="documents"
        accept="application/pdf,image/png,image/jpeg"
        maxSize={10_000_000}
        hint="PDF, PNG, or JPEG up to 10 MB each"
        showFileList={false}
        onValueChange={handleFiles}
      />

      {uploads.length > 0 && (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Active Uploads ({uploads.length})
          </p>
          <ul className="flex flex-col gap-3">
            {uploads.map(({ file, progress, status }) => (
              <li key={file.name} className="flex flex-col gap-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="max-w-xs truncate font-medium">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatBytes(file.size)}
                  </span>
                </div>
                <Progress
                  value={progress}
                  aria-label={`Upload progress for ${file.name}`}
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{status === 'uploading' ? 'Uploading to secure S3 storage…' : 'Finished'}</span>
                  <span className="font-mono">{progress}%</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
