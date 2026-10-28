'use client';

import { forwardRef, Fragment, useMemo, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../../lib/cn';
import type { SlotClassNames } from '../../lib/slots';
import { useControllableState } from '../../lib/use-controllable-state';
import { Checkbox } from '../../components/forms/checkbox/checkbox';

/** An action that can be granted, e.g. "View" or "Approve". A column of the matrix. */
export interface PermissionAction {
  /** Unique id, e.g. `view`. */
  id: string;
  /** Column heading, e.g. "View". */
  label: string;
}

/** Something permissions apply to, e.g. "Invoices". A row of the matrix. */
export interface PermissionResource {
  /** Unique id, e.g. `invoices`. */
  id: string;
  /** Row heading, e.g. "Invoices". */
  label: string;
  /** Small text under the label. */
  description?: ReactNode;
  /** Section heading the row is listed under, e.g. "Finance". Rows with the same group are kept together. */
  group?: string;
  /** Ids of the actions that apply. Other cells show a dash. @default every action */
  actions?: readonly string[];
}

/** The value key for one permission: `` `${resourceId}:${actionId}` ``. */
export function permissionKey(resourceId: string, actionId: string): string {
  return `${resourceId}:${actionId}`;
}

export type PermissionMatrixSlot = 'root' | 'table' | 'groupRow' | 'row' | 'resource' | 'cell';

export interface PermissionMatrixProps
  extends Omit<ComponentProps<'div'>, 'defaultValue' | 'onChange'> {
  /** Accessible name of the table, e.g. "Permissions for Accountant". */
  'aria-label': string;
  /** The rows. */
  resources: readonly PermissionResource[];
  /** The columns. */
  actions: readonly PermissionAction[];
  /** Granted permissions as `permissionKey()` strings (controlled). */
  value?: string[];
  /** Granted permissions at first (uncontrolled). @default [] */
  defaultValue?: string[];
  /** Called with the full list whenever a permission changes. */
  onValueChange?: (value: string[]) => void;
  /** Show the value without allowing changes. @default false */
  readOnly?: boolean;
  /** Add "all" checkboxes for each row and column. @default true */
  bulkToggles?: boolean;
  /** Keep the resource column visible while the matrix scrolls horizontally. @default true */
  stickyColumn?: boolean;
  /** Keep the header visible while scrolling down. @default false */
  stickyHeader?: boolean;
  /** Heading of the first column. @default 'Resource' */
  resourceLabel?: string;
  /** Accessible names for bulk toggles, for translation. */
  labels?: {
    /** @default (resource) => `All permissions for ${resource}` */
    row?: (resource: string) => string;
    /** @default (action) => `${action} for all` */
    column?: (action: string) => string;
    /** @default 'Not applicable' */
    notApplicable?: string;
    /** Accessible name when partially granted (mixed). @default (name) => `${name} (partially granted)` */
    mixed?: (name: string) => string;
  };
  /** Classes for inner parts. */
  classNames?: SlotClassNames<PermissionMatrixSlot>;
}

type ToggleState = { checked: boolean; indeterminate: boolean };

function stateOf(keys: string[], granted: ReadonlySet<string>): ToggleState {
  const on = keys.filter((k) => granted.has(k)).length;
  return { checked: on > 0 && on === keys.length, indeterminate: on > 0 && on < keys.length };
}

/**
 * A grid of checkboxes for role permissions: resources down the side, actions across the
 * top. Rows and columns have "all" toggles that show a mixed state. The value is a flat list
 * of `"resource:action"` keys, easy to send to an API.
 *
 * @example
 * <PermissionMatrix
 *   aria-label="Permissions for Accountant"
 *   actions={[{ id: 'view', label: 'View' }, { id: 'edit', label: 'Edit' }, { id: 'approve', label: 'Approve' }]}
 *   resources={[
 *     { id: 'invoices', label: 'Invoices', group: 'Finance' },
 *     { id: 'payroll', label: 'Payroll', group: 'HR', actions: ['view', 'approve'] },
 *   ]}
 *   value={granted}
 *   onValueChange={setGranted}
 * />
 */
export const PermissionMatrix = forwardRef<HTMLDivElement, PermissionMatrixProps>(function PermissionMatrix(
  {
    resources,
    actions,
    value,
    defaultValue = [],
    onValueChange,
    readOnly = false,
    bulkToggles = true,
    stickyColumn = true,
    stickyHeader = false,
    resourceLabel = 'Resource',
    labels,
    className,
    classNames,
    'aria-label': ariaLabel,
    ...props
  },
  ref,
) {
  const [list, setList] = useControllableState({ value, defaultValue, onChange: onValueChange });
  const granted = useMemo(() => new Set(list), [list]);

  const applies = (r: PermissionResource, a: PermissionAction) => !r.actions || r.actions.includes(a.id);
  const rowKeys = (r: PermissionResource) => actions.filter((a) => applies(r, a)).map((a) => permissionKey(r.id, a.id));
  const columnKeys = (a: PermissionAction) => resources.filter((r) => applies(r, a)).map((r) => permissionKey(r.id, a.id));

  const setMany = (keys: string[], on: boolean) => {
    if (readOnly) return;
    const next = new Set(granted);
    for (const k of keys) {
      if (on) next.add(k);
      else next.delete(k);
    }
    // Keep a stable order: matrix order, then any unknown keys that were passed in.
    const ordered = resources.flatMap(rowKeys).filter((k) => next.has(k));
    const known = new Set(ordered);
    setList([...ordered, ...list.filter((k) => !known.has(k) && next.has(k))]);
  };

  const groups = useMemo(() => {
    const map = new Map<string | undefined, PermissionResource[]>();
    for (const r of resources) {
      if (!map.has(r.group)) map.set(r.group, []);
      map.get(r.group)!.push(r);
    }
    return [...map.entries()];
  }, [resources]);

  const colCount = actions.length + 1;
  const rowLabel = labels?.row ?? ((r: string) => `All permissions for ${r}`);
  const colLabel = labels?.column ?? ((a: string) => `${a} for all`);
  const notApplicableText = labels?.notApplicable ?? 'Not applicable';

  return (
    <div
      ref={ref}
      data-slot="permission-matrix"
      className={cn('w-full overflow-x-auto rounded-lg border border-border', classNames?.root, className)}
      {...props}
    >
      <table
        aria-label={ariaLabel}
        data-slot="permission-matrix-table"
        className={cn('w-full border-collapse text-sm', classNames?.table)}
      >
        <thead className={cn('bg-muted/50', stickyHeader && 'sticky top-0 z-20 bg-muted')}>
          <tr>
            <th
              scope="col"
              className={cn(
                'px-4 py-2.5 text-start font-medium text-muted-foreground',
                stickyColumn && 'sticky start-0 z-10 bg-muted/95',
              )}
            >
              {resourceLabel}
            </th>
            {actions.map((a) => {
              const keys = columnKeys(a);
              const s = stateOf(keys, granted);
              return (
                <th key={a.id} scope="col" className="px-3 py-2.5 text-center font-medium text-muted-foreground">
                  <span className="flex flex-col items-center gap-1.5">
                    {a.label}
                    {bulkToggles && !readOnly && keys.length > 0 && (
                      <Checkbox
                        aria-label={labels?.mixed && s.indeterminate ? labels.mixed(a.label) : colLabel(a.label)}
                        checked={s.checked}
                        indeterminate={s.indeterminate}
                        onCheckedChange={() => setMany(keys, !s.checked)}
                      />
                    )}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {groups.map(([group, rows]) => (
            <Fragment key={group ?? '__none'}>
              {group && (
                <tr data-slot="permission-matrix-group-row" className={cn('border-t border-border bg-muted/25', classNames?.groupRow)}>
                  <th scope="colgroup" colSpan={colCount} className="px-4 py-1.5 text-start text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {group}
                  </th>
                </tr>
              )}
              {rows.map((r) => {
                const keys = rowKeys(r);
                const s = stateOf(keys, granted);
                return (
                  <tr key={r.id} data-slot="permission-matrix-row" className={cn('border-t border-border hover:bg-muted/30', classNames?.row)}>
                    <th
                      scope="row"
                      data-slot="permission-matrix-resource"
                      className={cn(
                        'px-4 py-2.5 text-start font-normal',
                        stickyColumn && 'sticky start-0 z-10 bg-card/95',
                        classNames?.resource,
                      )}
                    >
                      <span className="flex items-center gap-3">
                        {bulkToggles && !readOnly && keys.length > 0 && (
                          <Checkbox
                            aria-label={labels?.mixed && s.indeterminate ? labels.mixed(r.label) : rowLabel(r.label)}
                            checked={s.checked}
                            indeterminate={s.indeterminate}
                            onCheckedChange={() => setMany(keys, !s.checked)}
                          />
                        )}
                        <span className="flex min-w-0 flex-col">
                          <span className="font-medium text-foreground break-words">{r.label}</span>
                          {r.description && <span className="text-xs text-muted-foreground break-words">{r.description}</span>}
                        </span>
                      </span>
                    </th>
                    {actions.map((a) => {
                      const key = permissionKey(r.id, a.id);
                      return (
                        <td key={a.id} data-slot="permission-matrix-cell" className={cn('px-3 py-2.5 text-center', classNames?.cell)}>
                          {applies(r, a) ? (
                            <Checkbox
                              aria-label={`${a.label} ${r.label}`}
                              checked={granted.has(key)}
                              readOnly={readOnly}
                              disabled={readOnly}
                              onCheckedChange={(on) => setMany([key], on)}
                              className="align-middle"
                            />
                          ) : (
                            <span className="text-muted-foreground">
                              <span aria-hidden="true">—</span>
                              <span className="sr-only">{notApplicableText}</span>
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
});
