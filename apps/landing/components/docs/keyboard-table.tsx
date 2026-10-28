import { Kbd } from '@innostes/ui';

export interface KeyboardTableProps {
  /**
   * List of rows, where each row is a pair of:
   * 1. A key shortcut (e.g. 'Enter' or ['Ctrl', 'K'] or ['ArrowUp', 'ArrowDown'])
   * 2. The description of what the key does.
   */
  rows: [string | string[], string][];
}

/**
 * A table documenting keyboard shortcuts and actions using the design system's `Kbd` component.
 */
export function KeyboardTable({ rows }: KeyboardTableProps) {
  return (
    <div className="not-prose my-6 w-full overflow-x-auto rounded-lg border border-fd-border">
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
          {rows.map(([keys, action], index) => {
            const keyList = Array.isArray(keys) ? keys : [keys];
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
