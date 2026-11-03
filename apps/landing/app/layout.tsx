import { RootProvider } from 'fumadocs-ui/provider/next';
import { Toaster, TooltipProvider } from '@innostes/ui';
import { Inter, JetBrains_Mono } from 'next/font/google';
import type { Metadata } from 'next';
import './global.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
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
    default: 'Innostes — Open-Source Modular Business OS | Free to Self-Host',
    template: '%s | Innostes Business OS',
  },
  description:
    'Innostes is the open-source, decoupled business operating system for modern teams. Unify CRM, HR, Finance, Inventory, and DevOps on one hardened kernel. Deploy in under 5 minutes — 0 Rs, zero seat fees, 100% data ownership.',
  keywords: [
    'open source ERP',
    'self-hosted business OS',
    'modular ERP',
    'free ERP software',
    'decoupled business software',
    'headless ERP API',
    'CRM HR Finance Inventory',
    'self-hosted CRM',
    'FastAPI ERP',
    'Next.js enterprise software',
  ],
  authors: [{ name: 'Innostes', url: 'https://innostes.com' }],
  creator: 'Innostes',
  publisher: 'Innostes',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://innostes.com',
    siteName: 'Innostes Business OS',
    title: 'Innostes — Open-Source Business OS | Free to Self-Host',
    description:
      'The open-source, modular business operating system. Unify CRM, HR, Finance, and DevOps on one decoupled kernel. Free to self-host, zero seat fees.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Innostes — Open-Source Business OS',
    description: 'Modular, decoupled business OS. Free self-hosted. Zero seat fees. CRM, HR, Finance, DevInfra.',
    creator: '@innostes',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large' },
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'Innostes Business OS',
      operatingSystem: 'Linux, Docker, Kubernetes, Cloud',
      applicationCategory: 'BusinessApplication, ERP, CRM, HRMS',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      description:
        'Open-source, modular, decoupled business operating system unifying CRM, HR, Finance, Inventory, and DevOps on a hardened FastAPI/PostgreSQL kernel.',
      url: 'https://innostes.com',
    },
    {
      '@type': 'Organization',
      name: 'Innostes',
      url: 'https://innostes.com',
      logo: 'https://innostes.com/logo.svg',
      sameAs: ['https://github.com/innostes-dev/erp'],
    },
  ],
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className="flex min-h-screen flex-col bg-fd-background text-fd-foreground antialiased"
      >
        <RootProvider theme={{ defaultTheme: 'light' }}>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster />
        </RootProvider>
      </body>
    </html>
  );
}
