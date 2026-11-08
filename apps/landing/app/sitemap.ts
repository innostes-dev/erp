import type { MetadataRoute } from 'next';
import { apiSource, devSource, source } from '@/lib/source';
import { MODULES_DATA } from '@/lib/modules-data';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://innostes.com';

  const uiPages = source.getPages().map((page) => ({
    url: `${baseUrl}${page.url}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: page.url === '/ui/docs' ? 1.0 : 0.8,
  }));

  const devPages = devSource.getPages().map((page) => ({
    url: `${baseUrl}${page.url}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const apiPages = apiSource.getPages().map((page) => ({
    url: `${baseUrl}${page.url}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: page.url === '/api-reference' ? 1.0 : 0.8,
  }));

  return [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/ui`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    { url: `${baseUrl}/modules`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    ...Object.values(MODULES_DATA).map((m) => ({
      url: `${baseUrl}/modules/${m.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    })),
    { url: `${baseUrl}/build`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/services`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    ...uiPages,
    ...devPages,
    ...apiPages,
  ];
}
