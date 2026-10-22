import {
  createSearchAPI,
  type AdvancedIndex,
} from 'fumadocs-core/search/server';
import { devSource, source } from '@/lib/source';

/** One search index for both the developer docs and the UI docs. */
export const { GET } = createSearchAPI('advanced', {
  indexes: async () => {
    const sections = [
      { loader: devSource, label: 'Developer Docs' },
      { loader: source, label: 'innostes UI' },
    ] as const;

    return sections.flatMap(({ loader, label }) =>
      loader.getPages().map((page): AdvancedIndex => ({
        id: page.url,
        url: page.url,
        title: page.data.title,
        description: page.data.description,
        breadcrumbs: [label],
        structuredData: page.data.structuredData,
      })),
    );
  },
});
