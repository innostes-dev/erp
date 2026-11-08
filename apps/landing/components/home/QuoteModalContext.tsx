'use client';

import React, { createContext, useContext, useState } from 'react';
import { QuoteModal, type QuoteVariant } from './QuoteModal';

interface QuoteModalContextValue {
  /** `variant: 'build'` opens the problem-first "talk to an engineer" form. */
  openQuote: (moduleName?: string, variant?: QuoteVariant) => void;
  closeQuote: () => void;
}

const QuoteModalContext = createContext<QuoteModalContextValue>({
  openQuote: () => {},
  closeQuote: () => {},
});

export function useQuoteModal() {
  return useContext(QuoteModalContext);
}

export function QuoteModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultModule, setDefaultModule] = useState<string>('Innostes Business OS');
  const [variant, setVariant] = useState<QuoteVariant>('demo');
  const [openCount, setOpenCount] = useState(0);

  const openQuote = (moduleName?: string, nextVariant: QuoteVariant = 'demo') => {
    if (moduleName) setDefaultModule(moduleName);
    setVariant(nextVariant);
    setOpenCount((n) => n + 1); // remount the form so it starts fresh for each entry point
    setIsOpen(true);
  };

  const closeQuote = () => setIsOpen(false);

  return (
    <QuoteModalContext.Provider value={{ openQuote, closeQuote }}>
      {children}
      <QuoteModal
        key={openCount}
        variant={variant}
        isOpen={isOpen}
        onClose={closeQuote}
        defaultModule={defaultModule}
      />
    </QuoteModalContext.Provider>
  );
}
