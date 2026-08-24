"use client";

import React, { createContext, useContext } from 'react';
import { TableContextValue } from './types';

// ═══════════════════════════════════════════════
// Context Defaults
// ═══════════════════════════════════════════════

const defaultContext: TableContextValue = {
  variant: 'simple',
  size: 'md',
  stickyHeader: false,
  stickyFooter: false,
  stickyFirstColumn: false,
  stickyLastColumn: false,
  striped: false,
  hoverable: true,
  loading: false,
};

// ═══════════════════════════════════════════════
// Context
// ═══════════════════════════════════════════════

/**
 * Internal context consumed by all Table sub-components.
 * Avoids prop-drilling of shared table configuration.
 */
export const TableContext = createContext<TableContextValue>(defaultContext);
TableContext.displayName = 'TableContext';

// ═══════════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════════

/**
 * Returns the nearest Table's shared configuration.
 * Must be rendered inside a `<Table>` component.
 */
export function useTableContext(): TableContextValue {
  return useContext(TableContext);
}

// ═══════════════════════════════════════════════
// Provider Component
// ═══════════════════════════════════════════════

interface TableContextProviderProps extends Partial<TableContextValue> {
  children: React.ReactNode;
}

export const TableContextProvider: React.FC<TableContextProviderProps> = ({
  children,
  ...overrides
}) => {
  const value: TableContextValue = { ...defaultContext, ...overrides };
  return React.createElement(TableContext.Provider, { value }, children);
};
