import { render, type RenderOptions } from '@testing-library/react';
import { type ReactElement, type ReactNode } from 'react';
import { AuthProvider } from '@mono/kernel/auth';
import { ConfigProvider } from '@mono/kernel/config';

function AllProviders({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider flags={{}}>
      <AuthProvider>{children}</AuthProvider>
    </ConfigProvider>
  );
}

export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: AllProviders, ...options });
}
