'use client';

import React, { createContext, useContext, useState } from 'react';
import { QuoteModal } from './QuoteModal';

interface QuoteModalContextValue {
  openQuote: (moduleName?: string) => void;
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

  const openQuote = (moduleName?: string) => {
    if (moduleName) setDefaultModule(moduleName);
    setIsOpen(true);
  };

  const closeQuote = () => setIsOpen(false);

  return (
    <QuoteModalContext.Provider value={{ openQuote, closeQuote }}>
      {children}
      <QuoteModal
        isOpen={isOpen}
        onClose={closeQuote}
        defaultModule={defaultModule}
      />
    </QuoteModalContext.Provider>
  );
}
