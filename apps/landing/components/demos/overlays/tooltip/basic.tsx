'use client';

import {
  Button,
  Kbd,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@innostes/ui';
import { Archive, Pencil, Trash2 } from 'lucide-react';

const actions = [
  { label: 'Edit', icon: <Pencil />, shortcut: 'E' },
  { label: 'Archive', icon: <Archive />, shortcut: 'A' },
  { label: 'Delete', icon: <Trash2 />, shortcut: '⌫' },
];

export default function TooltipDemo() {
  return (
    <div className="flex gap-1 rounded-lg border border-border p-1">
      {actions.map((a) => (
        <Tooltip key={a.label}>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="sm" iconOnly aria-label={a.label} />
            }
          >
            {a.icon}
          </TooltipTrigger>
          <TooltipContent className="flex items-center gap-2">
            {a.label}{' '}
            <Kbd className="border-background/20 bg-background/10 text-background">
              {a.shortcut}
            </Kbd>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
