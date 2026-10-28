import { RootProvider } from 'fumadocs-ui/provider/next';
import { Toaster, TooltipProvider } from '@innostes/ui';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import './global.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://erp.innostes.com'),
  title: { default: 'innostes', template: '%s – innostes UI' },
  description: 'innostes — and the innostes UI design system.',
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <RootProvider theme={{ defaultTheme: 'light' }}>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster />
        </RootProvider>
      </body>
    </html>
  );
}
