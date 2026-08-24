"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ToastInstance, ToastOptions } from './types';

interface ToastContextValue {
  toasts: ToastInstance[];
  addToast: (content: ReactNode, options?: ToastOptions) => string | number;
  removeToast: (id: string | number) => void;
  clearAllToasts: () => void;
  updateToast: (id: string | number, options: Partial<ToastOptions>) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastInstance[]>([]);

  const removeToast = useCallback((id: string | number) => {
    setToasts((prev) => {
      const toast = prev.find((t) => t.id === id);
      if (toast) {
        toast.onClose?.();
      }
      return prev.filter((t) => t.id !== id);
    });
  }, []);

  const addToast = useCallback(
    (content: ReactNode, options: ToastOptions = {}) => {
      const id = options.toastId || Date.now() + Math.random();
      const newToast: ToastInstance = {
        id,
        content,
        createdAt: Date.now(),
        isVisible: true,
        autoClose: 5000,
        closeButton: true,
        progressBar: true,
        pauseOnHover: true,
        pauseOnFocusLoss: true,
        variant: 'default',
        animationDuration: 300,
        ...options,
      };

      setToasts((prev) => {
        // Remove existing toast with same ID if it exists
        const filtered = prev.filter((toast) => toast.id !== id);
        return [newToast, ...filtered];
      });

      // Auto close if enabled
      if (newToast.autoClose !== false) {
        setTimeout(() => {
          removeToast(id);
        }, newToast.autoClose);
      }

      // Call onOpen callback
      options.onOpen?.();

      return id;
    },
    [removeToast]
  );

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const updateToast = useCallback((id: string | number, options: Partial<ToastOptions>) => {
    setToasts((prev) => prev.map((toast) => (toast.id === id ? { ...toast, ...options } : toast)));
  }, []);

  const value: ToastContextValue = {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    updateToast,
  };

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
};

// Imperative API
class ToastManager {
  private static instance: ToastManager;
  private addToastFn: ((content: ReactNode, options?: ToastOptions) => string | number) | null =
    null;
  private removeToastFn: ((id: string | number) => void) | null = null;
  private clearAllToastsFn: (() => void) | null = null;
  private updateToastFn: ((id: string | number, options: Partial<ToastOptions>) => void) | null =
    null;

  static getInstance(): ToastManager {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager();
    }
    return ToastManager.instance;
  }

  setMethods(
    addToast: (content: ReactNode, options?: ToastOptions) => string | number,
    removeToast: (id: string | number) => void,
    clearAllToasts: () => void,
    updateToast: (id: string | number, options: Partial<ToastOptions>) => void
  ) {
    this.addToastFn = addToast;
    this.removeToastFn = removeToast;
    this.clearAllToastsFn = clearAllToasts;
    this.updateToastFn = updateToast;
  }

  show(content: ReactNode, options?: ToastOptions) {
    if (!this.addToastFn) {
      console.warn('Toast system not initialized. Make sure ToastContainer is mounted.');
      return '';
    }
    return this.addToastFn(content, options);
  }

  success(content: ReactNode, options?: Omit<ToastOptions, 'variant'>) {
    return this.show(content, { ...options, variant: 'success' });
  }

  error(content: ReactNode, options?: Omit<ToastOptions, 'variant'>) {
    return this.show(content, { ...options, variant: 'error' });
  }

  warning(content: ReactNode, options?: Omit<ToastOptions, 'variant'>) {
    return this.show(content, { ...options, variant: 'warning' });
  }

  info(content: ReactNode, options?: Omit<ToastOptions, 'variant'>) {
    return this.show(content, { ...options, variant: 'info' });
  }

  primary(content: ReactNode, options?: Omit<ToastOptions, 'variant'>) {
    return this.show(content, { ...options, variant: 'primary' });
  }

  dismiss(id: string | number) {
    if (!this.removeToastFn) {
      console.warn('Toast system not initialized.');
      return;
    }
    this.removeToastFn(id);
  }

  dismissAll() {
    if (!this.clearAllToastsFn) {
      console.warn('Toast system not initialized.');
      return;
    }
    this.clearAllToastsFn();
  }

  update(id: string | number, options: Partial<ToastOptions>) {
    if (!this.updateToastFn) {
      console.warn('Toast system not initialized.');
      return;
    }
    this.updateToastFn(id, options);
  }
}

export const toast = ToastManager.getInstance();
