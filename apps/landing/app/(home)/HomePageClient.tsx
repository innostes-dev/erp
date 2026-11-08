'use client';

import React from 'react';
import { HeroSection } from '@/components/home/HeroSection';
import { ProblemSection } from '@/components/home/ProblemSection';
import { HireStorySection } from '@/components/home/HireStorySection';
import { ModuleMapSection } from '@/components/home/ModuleMapSection';
import { KernelSecuritySection } from '@/components/home/KernelSecuritySection';
import { DeveloperFrameworkSection } from '@/components/home/DeveloperFrameworkSection';
import { FounderNoteSection } from '@/components/home/FounderNoteSection';
import { ServicesModelSection } from '@/components/home/ServicesModelSection';
import { FaqSection } from '@/components/home/FaqSection';
import { CtaSection } from '@/components/home/CtaSection';
import { useQuoteModal } from '@/components/home/QuoteModalContext';
import { ScrollExperience, SectionConnector, type StoryChapter } from '@/components/home/ScrollExperience';

const CHAPTERS: StoryChapter[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'problem', label: 'The problem' },
  { id: 'story', label: 'How it connects' },
  { id: 'modules', label: 'The system' },
  { id: 'security', label: 'Trust' },
  { id: 'developers', label: 'Builders' },
  { id: 'why', label: 'Why us' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'faq', label: 'Questions' },
  { id: 'get-started', label: 'Book a demo' },
];

export function HomePageClient() {
  const { openQuote } = useQuoteModal();
  const bookDemo = () => openQuote('Innostes Business OS');

  return (
    <main className="flex flex-1 flex-col bg-fd-background text-fd-foreground">
      <ScrollExperience chapters={CHAPTERS} />

      {/* 1. The promise */}
      <HeroSection onOpenQuote={bookDemo} />
      {/* 2. The tension: scattered tools converge */}
      <ProblemSection />
      {/* 3. Signature story: follow one hire through the company */}
      <HireStorySection />
      {/* 4. The connected module map */}
      <ModuleMapSection />
      <SectionConnector />
      {/* 5. Trust, for founders */}
      <KernelSecuritySection />
      {/* 6. For builders */}
      <DeveloperFrameworkSection />
      {/* 7. Honest proof */}
      <FounderNoteSection />
      <SectionConnector />
      {/* 8. Pricing + close */}
      <ServicesModelSection onOpenQuote={bookDemo} />
      {/* 9. Questions founders ask (also FAQPage schema) */}
      <FaqSection />
      <CtaSection onOpenQuote={bookDemo} />
    </main>
  );
}
