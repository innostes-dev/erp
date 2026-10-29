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
import { HrmsPage } from '@innostes/hrms';
import { CrmPage } from '@innostes/crm';
import { ArrowLeft, Building2, Users, LayoutGrid, Power } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { useModules } from '../context/ModulesContext';
import { BUSINESS_MODULES_CATALOG } from '../catalog';

interface ModuleShellLayoutProps {
  moduleId: string;
}

function getModuleIcon(id: string) {
  switch (id) {
    case 'hrms':
      return <Users className="size-4" />;
    case 'crm':
      return <Building2 className="size-4" />;
    default:
      return <LayoutGrid className="size-4" />;
  }
}

export function ModuleShellLayout({ moduleId }: ModuleShellLayoutProps) {
  const { user, logout } = useAuth();
  const { navigate } = useNavigation();
  const { activeModules, isModuleActive, activateModule } = useModules();

  const currentModule = BUSINESS_MODULES_CATALOG.find((m) => m.id === moduleId);
  const isActive = isModuleActive(moduleId);

  // Build sections for AppSwitcher
  const appSwitcherSections = [
    {
      label: 'Active Business Modules',
      apps: activeModules.map((mod) => ({
        id: mod.id,
        name: mod.name,
        description: mod.description,
        icon: getModuleIcon(mod.id),
        tone: mod.tone,
        onClick: () => navigate(`/modules/${mod.id}`),
      })),
      viewAll: {
        label: 'Manage all modules',
        onClick: () => navigate('/modules'),
      },
    },
  ];

  const fullName =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Arun';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Dedicated Business Module Top Bar */}
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

          {/* App Switcher for business applications */}
          <AppSwitcher
            value={moduleId}
            sections={appSwitcherSections}
            onValueChange={(chosenId) => navigate(`/modules/${chosenId}`)}
            showName
          />
        </TopBarStart>

        <TopBarCenter className="hidden md:flex">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  onClick={() => navigate('/')}
                  className="cursor-pointer"
                >
                  Ecosystem
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  onClick={() => navigate('/modules')}
                  className="cursor-pointer"
                >
                  Modules
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {currentModule?.name ?? moduleId.toUpperCase()}
                </BreadcrumbPage>
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

      {/* Module Content */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
        {!isActive ? (
          <EmptyState
            icon={
              <IconTile tone={currentModule?.tone ?? 'primary'} size="lg">
                {getModuleIcon(moduleId)}
              </IconTile>
            }
            title={`${currentModule?.name ?? moduleId.toUpperCase()} is not active`}
            description="This business module has not been activated for your tenant. Super Admins can activate it with one click."
            actions={
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  startIcon={<Power className="size-4" />}
                  onClick={() => void activateModule(moduleId)}
                >
                  Activate {currentModule?.name}
                </Button>
                <Button variant="outline" onClick={() => navigate('/modules')}>
                  Back to Modules Catalog
                </Button>
              </div>
            }
          />
        ) : moduleId === 'hrms' ? (
          <HrmsPage />
        ) : moduleId === 'crm' ? (
          <CrmPage />
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            Unknown Module: {moduleId}
          </div>
        )}
      </main>
    </div>
  );
}
