import { apiSource } from '@/lib/source';
import { docsPageMetadata, renderDocsPage } from '@/components/docs/docs-page';

interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

export default async function Page(props: PageProps) {
  const { slug } = await props.params;
  return renderDocsPage(apiSource, slug, '/api-reference');
}

export function generateStaticParams() {
  return apiSource.generateParams();
}

export async function generateMetadata(props: PageProps) {
  const { slug } = await props.params;
  return docsPageMetadata(apiSource, slug, 'innostes ERP API');
}
