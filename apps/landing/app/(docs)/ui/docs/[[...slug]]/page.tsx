import { source } from '@/lib/source';
import { docsPageMetadata, renderDocsPage } from '@/components/docs/docs-page';

export default async function Page(props: PageProps<'/ui/docs/[[...slug]]'>) {
  const { slug } = await props.params;
  return renderDocsPage(source, slug, '/ui/docs', {
    defaultInstall: 'pnpm add @innostes/ui',
  });
}

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(
  props: PageProps<'/ui/docs/[[...slug]]'>,
) {
  const { slug } = await props.params;
  return docsPageMetadata(source, slug, 'innostes UI');
}
