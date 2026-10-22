import { devSource } from '@/lib/source';
import { docsPageMetadata, renderDocsPage } from '@/components/docs/docs-page';

export default async function Page(props: PageProps<'/docs/[[...slug]]'>) {
  const { slug } = await props.params;
  return renderDocsPage(devSource, slug, '/docs');
}

export function generateStaticParams() {
  return devSource.generateParams();
}

export async function generateMetadata(props: PageProps<'/docs/[[...slug]]'>) {
  const { slug } = await props.params;
  return docsPageMetadata(devSource, slug, 'innostes Developer Docs');
}
