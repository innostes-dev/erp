import { loader } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';
import { defineDocs } from 'fumadocs-mdx/macro';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import { z } from 'zod';
import { devDocsRoute, docsRoute, apiDocsRoute } from './shared';

const docsPageSchema = pageSchema.extend({
  /** Badge shown next to the title, e.g. "Stable" or "Beta". */
  status: z.enum(['Stable', 'Beta', 'Experimental']).optional(),
  /** Short text shown on the right of the page header. */
  summary: z.string().optional(),
  /** Command shown (with a copy button) in the page header. */
  install: z.string().optional(),
});

/** innostes UI design system docs: content/docs → /ui/docs */
const uiDocs = defineDocs({
  dir: 'content/docs',
  docs: { schema: docsPageSchema },
  meta: { schema: metaSchema },
});

/** innostes developer docs: content/dev-docs → /docs */
const devDocs = defineDocs({
  dir: 'content/dev-docs',
  docs: { schema: docsPageSchema },
  meta: { schema: metaSchema },
});

/** innostes API reference docs: content/api-docs → /api-reference */
const apiDocs = defineDocs({
  dir: 'content/api-docs',
  docs: { schema: docsPageSchema },
  meta: { schema: metaSchema },
});

export const source = loader({
  baseUrl: docsRoute,
  source: uiDocs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});

export const devSource = loader({
  baseUrl: devDocsRoute,
  source: devDocs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});

export const apiSource = loader({
  baseUrl: apiDocsRoute,
  source: apiDocs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});

export type DocsSource = typeof source | typeof devSource | typeof apiSource;
