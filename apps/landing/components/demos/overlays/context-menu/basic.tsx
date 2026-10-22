'use client';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
  toast,
} from '@innostes/ui';
import { FileText } from 'lucide-react';

export default function ContextMenuDemo() {
  return (
    <ContextMenu>
      <ContextMenuTrigger className="flex h-40 w-full max-w-sm flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground select-none">
        <FileText className="size-6" />
        Right-click (or long-press) invoice-1042.pdf
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => toast('Opened')}>
          Open <ContextMenuShortcut>↵</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => toast('Downloading…')}>
          Download
        </ContextMenuItem>
        <ContextMenuItem onClick={() => toast('Rename')}>
          Rename <ContextMenuShortcut>F2</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          variant="destructive"
          onClick={() => toast.error('Deleted')}
        >
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
