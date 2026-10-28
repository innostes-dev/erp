import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  createSearchAPI,
  type AdvancedIndex,
} from 'fumadocs-core/search/server';
import { devSource, source } from '@/lib/source';

// Load api.json for component prop and symbol search
let apiComponents: Record<string, { description?: string; props: Record<string, { type?: string; description?: string }> }> = {};
try {
  const apiPath = join(process.cwd(), '..', '..', 'packages', 'ui', 'dist', 'api.json');
  if (existsSync(apiPath)) {
    const raw = JSON.parse(readFileSync(apiPath, 'utf8'));
    apiComponents = raw.components || {};
  }
} catch {
  // Gracefully fallback if api.json is not yet generated
}

/** One search index for both the developer docs and the UI docs, enriched with component props. */
export const { GET } = createSearchAPI('advanced', {
  indexes: async () => {
    const sections = [
      { loader: devSource, label: 'Developer Docs' },
      { loader: source, label: 'innostes UI' },
    ] as const;

    return sections.flatMap(({ loader, label }) =>
      loader.getPages().map((page): AdvancedIndex => {
        const structured = page.data.structuredData;
        const pageBasename = page.url.split('/').pop() || '';

        // Find relevant components for this page
        const relevant = Object.entries(apiComponents).filter(([name, comp]) => {
          const compKebab = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
          return compKebab === pageBasename || name.toLowerCase() === pageBasename.replace(/-/g, '');
        });

        if (relevant.length > 0 && structured?.contents) {
          const propList = relevant
            .flatMap(([name, comp]) => {
              const entries = Object.entries(comp.props || {});
              return entries.map(([pName, pMeta]) => `${pName}: ${pMeta.description || ''}`);
            })
            .join('; ');

          if (propList) {
            structured.contents.push({
              heading: 'Props Reference',
              content: `Props: ${propList}`,
            });
          }
        }

        return {
          id: page.url,
          url: page.url,
          title: page.data.title,
          description: page.data.description,
          breadcrumbs: [label],
          structuredData: structured,
        };
      }),
    );
  },
});
