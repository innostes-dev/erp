import { RootProvider } from 'fumadocs-ui/provider/next';
import { Toaster, TooltipProvider } from '@innostes/ui';
import { Inter, JetBrains_Mono } from 'next/font/google';
import type { Metadata } from 'next';
import './global.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://innostes.com'),
  title: {
    default: 'INNOSTES: Open-Source Business Operating System',
    template: '%s | INNOSTES',
  },
  description:
    'INNOSTES is an open-source business operating system for founders and growing companies. Hiring, HR, payroll, sales, inventory, projects and accounting in one connected system. Free to self-host, no per-seat fees.',
  keywords: [
    'open source business operating system',
    'open source ERP',
    'self-hosted ERP',
    'open source HR and payroll software',
    'open source CRM',
    'all-in-one business software for startups',
    'free ERP for small business',
    'self-hosted HRMS',
    'open source accounting software',
    'MIT licensed ERP',
  ],
  authors: [{ name: 'Innostes Technologies', url: 'https://innostes.com' }],
  creator: 'Innostes Technologies',
  publisher: 'Innostes Technologies',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://innostes.com',
    siteName: 'INNOSTES',
    title: 'INNOSTES: Your whole company. One operating system.',
    description:
      'Open-source system for founders: hiring, HR, payroll, sales, stock and the books, all connected. Free to self-host.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'INNOSTES: Your whole company. One operating system.',
    description: 'Open-source business OS for founders. Hiring, HR, payroll, sales, stock and accounting, all connected. Free to self-host.',
    creator: '@innostes',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large' },
  },
};

const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://innostes.com/#org',
      name: 'Innostes Technologies',
      url: 'https://innostes.com',
      logo: 'https://innostes.com/images/home/section_navbar/company-latest-logo.png',
      slogan: 'We love to innovate',
    },
    {
      '@type': 'SoftwareApplication',
      name: 'INNOSTES',
      url: 'https://innostes.com',
      applicationCategory: 'BusinessApplication',
      applicationSubCategory: 'ERP',
      operatingSystem: 'Web, Linux (Docker)',
      description:
        'Open-source business operating system. Recruiting, HR, payroll, CRM, accounting, inventory, projects and documents as connected modules on one shared core.',
      license: 'https://opensource.org/licenses/MIT',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR', description: 'Free to self-host. Managed setup available.' },
      featureList: ['Recruiting (HireFlow)', 'HR, attendance, leave and payroll (PeopleOps)', 'CRM (SalesFlow)', 'Accounting (LedgerFlow)', 'Inventory and assets (StockFlow)', 'Projects (SprintFlow)', 'Documents (DocFlow)', 'Role-based access control', 'Company-wide audit trail', 'REST APIs with OpenAPI'],
      publisher: { '@id': 'https://innostes.com/#org' },
    },
  ],
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }} />
      </head>
      <body
        className="flex min-h-screen flex-col bg-fd-background text-fd-foreground antialiased"
      >
        <RootProvider theme={{ attribute: 'class', defaultTheme: 'light', enableSystem: false }}>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster />
        </RootProvider>
      </body>
    </html>
  );
}
