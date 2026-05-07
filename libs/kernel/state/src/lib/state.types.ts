export interface KernelStore {
  theme: 'light' | 'dark' | 'system';
  locale: string;
  isSidebarOpen: boolean;
  setTheme: (theme: KernelStore['theme']) => void;
  setLocale: (locale: string) => void;
  toggleSidebar: () => void;
}
