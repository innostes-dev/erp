'use client';

import tokensData from '@/lib/tokens-data.json';

interface TokenItem {
  name: string;
  shortName: string;
  category: string;
  lightValue: string;
  darkValue: string;
  lightRaw: string;
  darkRaw: string;
}

interface CategoryGroup {
  role: string;
  description: string;
  tokens: string[];
}

export function TokenReference() {
  const categories = tokensData.categories as CategoryGroup[];
  const tokens = tokensData.tokens as TokenItem[];

  return (
    <div className="not-prose my-8 space-y-10">
      {categories.map((category) => {
        const catTokens = tokens.filter((t) => t.category === category.role);
        if (catTokens.length === 0) return null;

        return (
          <div key={category.role} className="space-y-3">
            <div>
              <h3 className="text-base font-semibold text-foreground">{category.role}</h3>
              <p className="text-xs text-muted-foreground">{category.description}</p>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border bg-card">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                    <th className="py-2.5 px-3 font-medium">Token</th>
                    <th className="py-2.5 px-3 font-medium">Light theme</th>
                    <th className="py-2.5 px-3 font-medium">Dark theme</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {catTokens.map((token) => (
                    <tr key={token.name} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-medium text-foreground whitespace-nowrap">
                        {token.name}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className="size-4 shrink-0 rounded border border-border shadow-xs"
                            style={{ backgroundColor: token.lightValue }}
                            aria-hidden="true"
                          />
                          <code className="text-[11px] text-muted-foreground">{token.lightValue}</code>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className="size-4 shrink-0 rounded border border-border shadow-xs"
                            style={{ backgroundColor: token.darkValue }}
                            aria-hidden="true"
                          />
                          <code className="text-[11px] text-muted-foreground">{token.darkValue}</code>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
