import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ServerCodeBlock } from 'fumadocs-ui/components/codeblock.rsc';
import { cn } from '@innostes/ui';
import { demos } from '@/components/demos/registry';
import { PreviewTabs } from './preview-tabs';

/**
 * Renders a live demo from `components/demos/<name>.tsx` next to its exact source code.
 * The code shown is the file that runs, so examples can't go stale.
 */
export function ComponentPreview({
  name,
  className,
  align = 'center',
}: {
  /** Demo path without extension, e.g. "overlays/dialog/basic". */
  name: string;
  /** Classes for the preview area (e.g. a fixed height for layout demos). */
  className?: string;
  /** Where to place the demo in the preview area. */
  align?: 'center' | 'start';
}) {
  const Demo = demos[name];
  if (!Demo)
    throw new Error(
      `Unknown demo "${name}". Add components/demos/${name}.tsx.`,
    );

  const source = readFileSync(
    join(process.cwd(), 'components', 'demos', `${name}.tsx`),
    'utf8',
  )
    .replace(/^'use client';\s*/, '')
    .trim();

  return (
    <PreviewTabs
      preview={
        <div
          className={cn(
            'flex min-h-48 w-full min-w-0 max-w-full overflow-hidden flex-wrap gap-4 p-4 sm:p-10',
            align === 'center'
              ? 'items-center justify-center'
              : 'items-start justify-start',
            className,
          )}
        >
          <Demo />
        </div>
      }
      code={
        <ServerCodeBlock
          code={source}
          lang="tsx"
          codeblock={{ className: 'my-0 rounded-none border-0' }}
        />
      }
    />
  );
}
