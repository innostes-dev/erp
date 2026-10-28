'use client';

import tokensData from '@/lib/tokens-data.json';

interface ContrastPair {
  name: string;
  textToken: string;
  bgToken: string;
  requirement: string;
  minRatio: number;
  light: {
    ratio: number;
    formatted: string;
    pass: boolean;
  };
  dark: {
    ratio: number;
    formatted: string;
    pass: boolean;
  };
}

export function ContrastTable() {
  const pairs = tokensData.contrastPairs as ContrastPair[];

  return (
    <div className="not-prose my-8 overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-muted-foreground">
            <th className="py-2.5 px-3 font-medium">Token pairing</th>
            <th className="py-2.5 px-3 font-medium">Variables</th>
            <th className="py-2.5 px-3 font-medium">Light ratio</th>
            <th className="py-2.5 px-3 font-medium">Dark ratio</th>
            <th className="py-2.5 px-3 font-medium">Standard</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {pairs.map((pair) => (
            <tr key={pair.name} className="hover:bg-muted/30 transition-colors">
              <td className="py-2.5 px-3 font-medium text-foreground whitespace-nowrap">
                {pair.name}
              </td>
              <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                <span>{pair.textToken.replace('--color-', '')}</span>
                <span className="mx-1 text-muted-foreground/60">on</span>
                <span>{pair.bgToken.replace('--color-', '')}</span>
              </td>
              <td className="py-2.5 px-3 whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-medium text-foreground">{pair.light.formatted}</span>
                  <span
                    className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                      pair.light.pass
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                    }`}
                  >
                    {pair.light.pass ? 'AA Pass' : 'Fail'}
                  </span>
                </div>
              </td>
              <td className="py-2.5 px-3 whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-medium text-foreground">{pair.dark.formatted}</span>
                  <span
                    className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                      pair.dark.pass
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                    }`}
                  >
                    {pair.dark.pass ? 'AA Pass' : 'Fail'}
                  </span>
                </div>
              </td>
              <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                ≥ {pair.minRatio}:1 (AA)
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
