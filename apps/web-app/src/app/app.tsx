import { useEffect, useRef } from 'react';
import { SidebarInset, SidebarProvider, SkipLink } from '@innostes/ui';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { TenantProvider } from './context/TenantContext';
import { ModulesProvider } from './context/ModulesContext';
import { PluginsProvider } from './context/PluginsContext';
import { AppSidebar } from './components/AppSidebar';
import { TopHeader } from './components/TopHeader';
import { EcosystemHome } from './components/EcosystemHome';
import { ModulesManagerPage } from './components/ModulesManagerPage';
import { PluginsManagerPage } from './components/PluginsManagerPage';
import { ModuleWorkspace } from './components/ModuleWorkspace';
import { PluginWorkspace } from './components/PluginWorkspace';
import { ApiKeysManager } from './components/ApiKeysManager';
import { AuditTrailPage } from './components/AuditTrailPage';
import { NotFoundPage } from './components/NotFoundPage';
import { PageContainer } from './components/PageContainer';

function RouteContent() {
  const { route } = useNavigation();
  switch (route.kind) {
    case 'home':
      return <PageContainer><EcosystemHome /></PageContainer>;
    case 'modules-catalog':
      return <PageContainer><ModulesManagerPage /></PageContainer>;
    case 'plugins-catalog':
      return <PageContainer><PluginsManagerPage /></PageContainer>;
    case 'module':
      return (
        <PageContainer>
          <ModuleWorkspace key={route.moduleId} moduleId={route.moduleId} subId={route.subId} />
        </PageContainer>
      );
    case 'plugin':
      // Plugins own a full-bleed workspace (e.g. Tracura's split views).
      return <PluginWorkspace key={route.pluginId} pluginId={route.pluginId} subId={route.subId} />;
    case 'audit':
      return <PageContainer><AuditTrailPage /></PageContainer>;
    case 'api-keys':
      return <PageContainer width="default"><ApiKeysManager /></PageContainer>;
    default:
      return <NotFoundPage />;
  }
}

/**
 * The single application shell: persistent navy sidebar + top bar + content.
 * Every page (home, modules, plugins, administration) renders inside it.
 */
function AppShell() {
  const { path } = useNavigation();
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  // Move focus to the new page on client-side navigation so keyboard and screen-reader
  // users land on the content (WCAG 2.4.3); skip the initial load.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    mainRef.current?.focus({ preventScroll: true });
  }, [path]);

  return (
    <SidebarProvider width="15.5rem">
      <SkipLink targetId="main-content">Skip to main content</SkipLink>
      <AppSidebar />
      <SidebarInset className="flex min-h-svh min-w-0 flex-1 flex-col bg-canvas">
        <TopHeader />
        <main
          id="main-content"
          ref={mainRef}
          tabIndex={-1}
          className="flex min-w-0 flex-1 flex-col outline-none"
        >
          <RouteContent />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export function App() {
  return (
    <NavigationProvider>
      <TenantProvider>
        <ModulesProvider>
          <PluginsProvider>
            <AppShell />
          </PluginsProvider>
        </ModulesProvider>
      </TenantProvider>
    </NavigationProvider>
  );
}

export default App;
