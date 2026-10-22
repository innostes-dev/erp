import { DocsBody, DocsPage } from 'fumadocs-ui/layouts/notebook/page';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { DocsSource } from '@/lib/source';
import { getMDXComponents } from '@/components/mdx';
import { PageHeader } from './page-header';

/** Renders one MDX page from a docs source, with the shared innostes header. */
export function renderDocsPage(
  source: DocsSource,
  slug: string[] | undefined,
  rootUrl: string,
  options: { defaultInstall?: string } = {},
) {
  const page = source.getPage(slug);
  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      breadcrumb={{ includeRoot: { url: rootUrl }, includePage: true }}
      tableOfContent={{ style: 'clerk' }}
    >
      <PageHeader
        title={page.data.title}
        description={page.data.description}
        status={page.data.status}
        summary={page.data.summary}
        install={page.data.install ?? options.defaultInstall}
      />
      <DocsBody>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <MDX
          components={getMDXComponents({
            a: createRelativeLink(source as any, page as any),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export function docsPageMetadata(
  source: DocsSource,
  slug: string[] | undefined,
  section: string,
): Metadata {
  const page = source.getPage(slug);
  if (!page) notFound();
  return {
    title: `${page.data.title} – ${section}`,
    description: page.data.description,
  };
}
