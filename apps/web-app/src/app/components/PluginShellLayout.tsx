import {
  AppSwitcher,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  IconTile,
  TopBar,
  TopBarStart,
  TopBarCenter,
  TopBarEnd,
  UserMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  EmptyState,
} from '@innostes/ui';
import { useAuth } from '@innostes/kernel';
import { ApiLoggerPage } from '@innostes/api-logger';
import {
  ArrowLeft,
  Puzzle,
  Activity,
  Power,
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { usePlugins } from '../context/PluginsContext';
import { PLUGINS_CATALOG } from '../catalog';

interface PluginShellLayoutProps {
  pluginId: string;
}

function getPluginIcon(id: string) {
  switch (id) {
    case 'api-logger':
      return <Activity className="size-4" />;
    default:
      return <Puzzle className="size-4" />;
  }
}

export function PluginShellLayout({ pluginId }: PluginShellLayoutProps) {
  const { user, logout } = useAuth();
  const { navigate } = useNavigation();
  const { activePlugins, isPluginActive, activatePlugin } = usePlugins();

  const currentPlugin = PLUGINS_CATALOG.find((p) => p.id === pluginId);
  const isActive = isPluginActive(pluginId);

  // Build sections for Plugin Switcher
  const pluginSwitcherSections = [
    {
      label: 'Active Extensible Plugins',
      apps: activePlugins.map((plug) => ({
        id: plug.id,
        name: plug.name,
        description: plug.description,
        icon: getPluginIcon(plug.id),
        tone: plug.tone,
        onClick: () => navigate(`/plugins/${plug.id}`),
      })),
      viewAll: {
        label: 'Manage all plugins',
        onClick: () => navigate('/plugins'),
      },
    },
  ];

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Arun';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Dedicated Plugin Top Bar */}
      <TopBar className="border-b border-border bg-background/95 backdrop-blur">
        <TopBarStart className="gap-3">
          <Button
            variant="ghost"
            size="sm"
            startIcon={<ArrowLeft className="size-4" />}
            onClick={() => navigate('/')}
          >
            Ecosystem
          </Button>

          <div className="h-4 w-px bg-border" />

          {/* Plugin Switcher for extensible tools and plugins */}
          <AppSwitcher
            value={pluginId}
            sections={pluginSwitcherSections}
            onValueChange={(chosenId) => navigate(`/plugins/${chosenId}`)}
            showName
          />
        </TopBarStart>

        <TopBarCenter className="hidden md:flex">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink onClick={() => navigate('/')} className="cursor-pointer">
                  Ecosystem
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink onClick={() => navigate('/plugins')} className="cursor-pointer">
                  Plugins
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{currentPlugin?.name ?? pluginId.toUpperCase()}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </TopBarCenter>

        <TopBarEnd className="gap-2">
          <UserMenu
            name={fullName}
            subtitle="Acme Corp"
            email={user?.email || 'arun@acme.com'}
            align="end"
          >
            <DropdownMenuItem onClick={() => navigate('/')}>
              Ecosystem Home
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/modules')}>
              All Modules
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/plugins')}>
              Plugins & Tools
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void logout(false)}>
              Sign out
            </DropdownMenuItem>
          </UserMenu>
        </TopBarEnd>
      </TopBar>

      {/* Plugin Content */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
        {!isActive ? (
          <EmptyState
            icon={
              <IconTile tone={currentPlugin?.tone ?? 'primary'} size="lg">
                {getPluginIcon(pluginId)}
              </IconTile>
            }
            title={`${currentPlugin?.name ?? pluginId.toUpperCase()} is not active`}
            description="This plugin has not been activated for your tenant. Super Admins can activate it from the Plugins catalog."
            actions={
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  startIcon={<Power className="size-4" />}
                  onClick={() => void activatePlugin(pluginId)}
                >
                  Activate {currentPlugin?.name}
                </Button>
                <Button variant="outline" onClick={() => navigate('/plugins')}>
                  Back to Plugins Catalog
                </Button>
              </div>
            }
          />
        ) : pluginId === 'api-logger' ? (
          <ApiLoggerPage />
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            Unknown Plugin: {pluginId}
          </div>
        )}
      </main>
    </div>
  );
}
