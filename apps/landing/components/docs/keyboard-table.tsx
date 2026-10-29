import { Kbd } from '@innostes/ui';

export interface KeyboardRowObject {
  key?: string | string[];
  keys?: string | string[];
  action: string;
}

export type KeyboardTableRow = [string | string[], string] | KeyboardRowObject;

export interface KeyboardTableProps {
  /**
   * List of rows, where each row is either:
   * 1. A pair: `[keys, action]` (e.g. `['Enter', 'Submits form']` or `[['Ctrl', 'K'], 'Opens search']`)
   * 2. An object: `{ key: '...', action: '...' }`
   */
  rows?: KeyboardTableRow[];
  /** Alias for `rows` when passed as an object array. */
  entries?: KeyboardTableRow[];
}

/**
 * A table documenting keyboard shortcuts and actions using the design system's `Kbd` component.
 */
export function KeyboardTable({ rows, entries }: KeyboardTableProps) {
  const items = rows ?? entries ?? [];

  return (
    <div tabIndex={0} role="region" aria-label="Keyboard shortcuts" className="not-prose my-6 w-full overflow-x-auto rounded-lg border border-fd-border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-fd-muted/50 text-start font-medium text-fd-muted-foreground">
          <tr className="border-b border-fd-border">
            <th scope="col" className="px-4 py-2.5 text-start font-medium">
              Key
            </th>
            <th scope="col" className="px-4 py-2.5 text-start font-medium">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-fd-border">
          {items.map((item, index) => {
            let keySpec: string | string[] | undefined;
            let action: string = '';

            if (Array.isArray(item)) {
              keySpec = item[0];
              action = item[1];
            } else if (item && typeof item === 'object') {
              keySpec = item.key ?? item.keys;
              action = item.action;
            }

            const keyList = Array.isArray(keySpec)
              ? keySpec
              : keySpec
                ? [keySpec]
                : [];

            return (
              <tr key={index} className="hover:bg-fd-muted/30">
                <td className="px-4 py-2.5 font-normal">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {keyList.map((k, kIndex) => (
                      <Kbd key={kIndex}>{k}</Kbd>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-fd-foreground">{action}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
