import { type ReactNode } from 'react';
import { cn } from '@innostes/ui';

export interface AnatomySlot {
  /** The `data-slot` attribute name (e.g. "root", "header", "content"). */
  name: string;
  /** Purpose of this DOM element. */
  description: ReactNode;
  /** Default HTML element or ARIA role (e.g. `<button>`, `role="dialog"`). */
  element?: string;
  /** Whether the slot is optional or conditionally rendered. */
  optional?: boolean;
}

export interface AnatomyProps {
  /** The slots that make up this component's DOM structure. */
  slots: AnatomySlot[];
  /** Optional diagram or visual representation. */
  children?: ReactNode;
  className?: string;
}

/**
 * Anatomy section documenting the DOM structure, sub-elements, and data-slot attributes of a component.
 */
export function Anatomy({ slots, children, className }: AnatomyProps) {
  return (
    <div className={cn('not-prose my-6 flex flex-col gap-4', className)}>
      {children && (
        <div className="flex items-center justify-center rounded-xl border border-fd-border bg-fd-card p-6">
          {children}
        </div>
      )}
      <div tabIndex={0} role="region" aria-label="Component anatomy slots" className="w-full overflow-x-auto rounded-lg border border-fd-border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-fd-muted/50 text-start font-medium text-fd-muted-foreground">
            <tr className="border-b border-fd-border">
              <th scope="col" className="px-4 py-2.5 text-start font-medium">
                Slot name
              </th>
              <th scope="col" className="px-4 py-2.5 text-start font-medium">
                Element / Role
              </th>
              <th scope="col" className="px-4 py-2.5 text-start font-medium">
                Description
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-fd-border">
            {slots.map((s) => (
              <tr key={s.name} className="hover:bg-fd-muted/30">
                <td className="px-4 py-2.5 font-mono text-xs font-semibold text-primary">
                  data-slot="{s.name}"
                  {s.optional && (
                    <span className="ms-2 rounded-sm bg-fd-muted px-1 py-0.5 font-sans text-[10px] font-normal text-fd-muted-foreground">
                      optional
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-fd-muted-foreground">
                  {s.element ?? '<div>'}
                </td>
                <td className="px-4 py-2.5 text-xs text-fd-foreground">
                  {s.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
