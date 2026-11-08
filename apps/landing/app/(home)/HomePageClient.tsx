'use client';

import React from 'react';
import { HeroSection } from '@/components/home/HeroSection';
import { DecoupledUspSection } from '@/components/home/DecoupledUspSection';
import { ModuleMatrixSection } from '@/components/home/ModuleMatrixSection';
import { DeveloperFrameworkSection } from '@/components/home/DeveloperFrameworkSection';
import { KernelSecuritySection } from '@/components/home/KernelSecuritySection';
import { ServicesModelSection } from '@/components/home/ServicesModelSection';
import { ArchitectureComparisonSection } from '@/components/home/ArchitectureComparisonSection';
import { CtaSection } from '@/components/home/CtaSection';
import { useQuoteModal } from '@/components/home/QuoteModalContext';

export default function HomePage() {
  const { openQuote } = useQuoteModal();

  return (
    <main className="flex flex-1 flex-col bg-fd-background text-fd-foreground">
      {/* 1. Hero Section with Dual-Mode Sandbox */}
      <HeroSection onOpenQuote={() => openQuote('Innostes Business OS')} />

      {/* 2. Decoupled Architecture USP (Turnkey vs Headless vs Standalone UI) */}
      <DecoupledUspSection />

      {/* 3. The Modular Business Suites Matrix (Clickable to dedicated landing pages) */}
      <ModuleMatrixSection />

      {/* 4. Company Developer Tools (Enterprise Design System + Tracura API Telemetry) */}
      <DeveloperFrameworkSection />

      {/* 5. Kernel Security & Multi-Tenancy Governance */}
      <KernelSecuritySection />

      {/* 6. Transparent Commercial Model (0 Rs Self-Hosted vs Assisted Setup Quotes) */}
      <ServicesModelSection onOpenQuote={() => openQuote('Innostes Business OS')} />

      {/* 7. Objective Architectural Comparison */}
      <ArchitectureComparisonSection />

      {/* 8. Conversion Call to Action */}
      <CtaSection onOpenQuote={() => openQuote('Innostes Business OS')} />
    </main>
  );
}
