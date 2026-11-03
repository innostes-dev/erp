import type { ReactNode } from 'react';
import { LandingHeader } from '@/components/home/LandingHeader';
import { CompanyFooter } from '@/components/home/CompanyFooter';
import { QuoteModalProvider } from '@/components/home/QuoteModalContext';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <QuoteModalProvider>
      <div className="site-canvas flex min-h-screen flex-col text-fd-foreground transition-colors duration-300">
        <LandingHeader />
        <div className="flex-1">{children}</div>
        <CompanyFooter />
      </div>
    </QuoteModalProvider>
  );
}
