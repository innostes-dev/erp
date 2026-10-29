import { SidebarProvider, SidebarInset } from '@innostes/ui';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { ModulesProvider } from './context/ModulesContext';
import { PluginsProvider } from './context/PluginsContext';
import { SidebarNav } from './components/SidebarNav';
import { TopHeader } from './components/TopHeader';
import { EcosystemHome } from './components/EcosystemHome';
import { ModulesManagerPage } from './components/ModulesManagerPage';
import { PluginsManagerPage } from './components/PluginsManagerPage';
import { ModuleShellLayout } from './components/ModuleShellLayout';
import { PluginShellLayout } from './components/PluginShellLayout';
import { ApiKeysManager } from './components/ApiKeysManager';

function AppRouter() {
  const { path } = useNavigation();

  // 1. Dedicated Business Module Shell (e.g. /modules/hrms, /modules/crm)
  if (path.startsWith('/modules/')) {
    const moduleId = path.replace('/modules/', '').split('/')[0];
    if (moduleId) {
      return <ModuleShellLayout moduleId={moduleId} />;
    }
  }

  // 2. Dedicated Plugin Shell (e.g. /plugins/api-logger)
  if (path.startsWith('/plugins/')) {
    const pluginId = path.replace('/plugins/', '').split('/')[0];
    if (pluginId) {
      return <PluginShellLayout pluginId={pluginId} />;
    }
  }

  // 3. Ecosystem Standard Shell (Home, Modules Catalog, Plugins Catalog)
  return (
    <SidebarProvider width="16rem">
      <div className="flex min-h-screen w-full bg-background">
        <SidebarNav />
        <SidebarInset className="flex-1 flex flex-col min-w-0 bg-muted/15">
          <TopHeader />
          <div className="flex-1 overflow-y-auto">
            {path === '/modules' ? (
              <ModulesManagerPage />
            ) : path === '/plugins' ? (
              <PluginsManagerPage />
            ) : path.startsWith('/administration') || path === '/api-keys' ? (
              <ApiKeysManager />
            ) : (
              <EcosystemHome />
            )}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

export function App() {
  return (
    <NavigationProvider>
      <ModulesProvider>
        <PluginsProvider>
          <AppRouter />
        </PluginsProvider>
      </ModulesProvider>
    </NavigationProvider>
  );
}

export default App;
