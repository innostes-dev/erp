import type { ReactNode } from 'react';
import { Badge, PageHeader, Tooltip, TooltipContent, TooltipTrigger } from '@innostes/ui';

/**
 * Page header for module pages. `preview` marks pages that still show sample data, so
 * illustrative numbers are never mistaken for live business data.
 */
export function ModulePageHeader({
  title,
  description,
  actions,
  preview = false,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  preview?: boolean;
}) {
  return (
    <PageHeader
      title={
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {title}
          {preview && (
            <Tooltip>
              <TooltipTrigger render={<span tabIndex={0} className="inline-flex rounded-sm outline-none focus-visible:outline-2 focus-visible:outline-ring" />}>
                <Badge variant="secondary">Preview · sample data</Badge>
              </TooltipTrigger>
              <TooltipContent>This module is in preview. Figures below are illustrative, not your data.</TooltipContent>
            </Tooltip>
          )}
        </span>
      }
      description={description}
      actions={actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    />
  );
}
