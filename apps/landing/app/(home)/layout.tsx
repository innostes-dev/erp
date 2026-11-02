import type { ReactNode } from 'react';
import { LandingHeader } from '@/components/home/LandingHeader';
import { CompanyFooter } from '@/components/home/CompanyFooter';
import { QuoteModalProvider } from '@/components/home/QuoteModalContext';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <QuoteModalProvider>
      <div className="flex min-h-screen flex-col bg-fd-background text-fd-foreground">
        <LandingHeader />
        <div className="flex-1">{children}</div>
        <CompanyFooter />
      </div>
    </QuoteModalProvider>
  );
}
