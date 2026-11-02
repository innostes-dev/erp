import { RootProvider } from 'fumadocs-ui/provider/next';
import { Toaster, TooltipProvider } from '@innostes/ui';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import './global.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://erp.innostes.com'),
  title: { default: 'Innostes — The Modular Business Operating System', template: '%s | Innostes' },
  description:
    'Innostes is an extensible, modular business operating system uniting operations, revenue, workforce, and developer infrastructure. 100% free to self-host with zero seat fees.',
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col bg-fd-background text-fd-foreground">
        <RootProvider theme={{ defaultTheme: 'light' }}>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster />
        </RootProvider>
      </body>
    </html>
  );
}
