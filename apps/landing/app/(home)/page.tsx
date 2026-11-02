'use client';

import React, { useState } from 'react';
import { HeroSection } from '@/components/home/HeroSection';
import { DecoupledUspSection } from '@/components/home/DecoupledUspSection';
import { ModuleMatrixSection } from '@/components/home/ModuleMatrixSection';
import { DeveloperFrameworkSection } from '@/components/home/DeveloperFrameworkSection';
import { KernelSecuritySection } from '@/components/home/KernelSecuritySection';
import { ServicesModelSection } from '@/components/home/ServicesModelSection';
import { ArchitectureComparisonSection } from '@/components/home/ArchitectureComparisonSection';
import { CtaSection } from '@/components/home/CtaSection';
import { CompanyFooter } from '@/components/home/CompanyFooter';
import { QuoteModal } from '@/components/home/QuoteModal';

export default function HomePage() {
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);

  return (
    <main className="flex flex-1 flex-col bg-fd-background text-fd-foreground">
      {/* 1. Hero Section with Dual-Mode Sandbox */}
      <HeroSection onOpenQuote={() => setIsQuoteOpen(true)} />

      {/* 2. Decoupled Architecture USP (Turnkey vs Headless vs Standalone UI) */}
      <DecoupledUspSection />

      {/* 3. The Modular Business Suites Matrix (Clickable to dedicated landing pages) */}
      <ModuleMatrixSection />

      {/* 4. Standalone Developer Tools & Infrastructure (@innostes/ui + Tracura) */}
      <DeveloperFrameworkSection />

      {/* 5. Kernel Security & Multi-Tenancy Governance */}
      <KernelSecuritySection />

      {/* 6. Transparent Commercial Model (0 Rs Self-Hosted vs Assisted Setup Quotes) */}
      <ServicesModelSection onOpenQuote={() => setIsQuoteOpen(true)} />

      {/* 7. Objective Architectural Comparison */}
      <ArchitectureComparisonSection />

      {/* 8. Conversion Call to Action */}
      <CtaSection onOpenQuote={() => setIsQuoteOpen(true)} />

      {/* 9. Comprehensive Semantic Footer */}
      <CompanyFooter />

      {/* Quote & Consultation Drawer Modal */}
      <QuoteModal
        isOpen={isQuoteOpen}
        onClose={() => setIsQuoteOpen(false)}
        defaultModule="Innostes Business OS"
      />
    </main>
  );
}
