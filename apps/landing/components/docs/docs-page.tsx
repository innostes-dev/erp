import { DocsBody, DocsPage } from 'fumadocs-ui/page';
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
      editOnGithub={{
        owner: 'innostes',
        repo: 'erp',
        sha: 'main',
        path: `apps/landing/content/${rootUrl === '/docs' ? 'dev-docs' : rootUrl === '/api-reference' ? 'api-docs' : 'docs'}/${page.path}`,
      }}
      lastUpdate={new Date()}
    >
      <PageHeader
        title={page.data.title}
        description={page.data.description}
        status={page.data.status}
        summary={page.data.summary}
        install={page.data.install ?? options.defaultInstall}
        owner={(page.data as any).owner}
        lastReviewed={(page.data as any).lastReviewed}
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
  const title = `${page.data.title} – ${section}`;
  const description = page.data.description;
  const url = `https://innostes.com${page.url}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: section,
      type: 'article',
      images: [
        {
          url: `/api/og?title=${encodeURIComponent(page.data.title)}&section=${encodeURIComponent(section)}&description=${encodeURIComponent(description ?? '')}`,
          width: 1200,
          height: 630,
          alt: page.data.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [
        `/api/og?title=${encodeURIComponent(page.data.title)}&section=${encodeURIComponent(section)}`,
      ],
    },
  };
}
