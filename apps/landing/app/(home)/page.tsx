import { HomePageClient } from './HomePageClient';
import { FAQS } from '@/components/home/faq-data';

/** Server wrapper: emits the FAQPage schema outside the client tree, then renders the page. */
export default function HomePage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <HomePageClient />
    </>
  );
}
