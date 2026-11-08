import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@innostes/ui';
import { BrandLogo } from '@innostes/kernel';
import { ChevronsUpDown, Home, KeyRound, LayoutGrid, Puzzle, ShieldCheck } from 'lucide-react';
import { Link, useNavigation } from '../context/NavigationContext';
import { useModules } from '../context/ModulesContext';
import { usePlugins } from '../context/PluginsContext';
import { useCurrentTenant } from '../context/TenantContext';
import { paths } from '../navigation/routes';
import { appIcon, pageIcon } from '../navigation/icons';
import type { CatalogItem } from '../catalog';

/**
 * The one persistent navigation of the Business OS: solid Midnight Navy, grouped,
 * with the current module's pages expanded inline. Every item is a real link.
 */
export function AppSidebar() {
  const { route } = useNavigation();
  const { activeModules } = useModules();
  const { activePlugins } = usePlugins();
  const { open, isMobile } = useSidebar();
  const collapsed = !open && !isMobile;

  const currentModuleId = route.kind === 'module' ? route.moduleId : null;
  const currentPluginId = route.kind === 'plugin' ? route.pluginId : null;

  return (
    <Sidebar label="Main navigation" collapsible="icon">
      <SidebarHeader className="h-16 justify-center border-b border-sidebar-border px-4">
        <Link
          href={paths.home}
          className="rounded-md outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring"
          aria-label="INNOSTES Business OS: home"
        >
          {collapsed ? (
            <BrandLogo variant="symbol" surface="dark" imageClassName="h-7" />
          ) : (
            <BrandLogo variant="wordmark" surface="dark" withProductLabel imageClassName="h-6" />
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="py-2">
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={route.kind === 'home'}
                icon={<Home />}
                render={<Link href={paths.home} />}
              >
                Home
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Modules</SidebarGroupLabel>
          <SidebarMenu>
            {activeModules.map((mod) => (
              <AppNavItem
                key={mod.id}
                item={mod}
                href={paths.module(mod.id)}
                isCurrent={currentModuleId === mod.id}
                currentSubId={route.kind === 'module' ? route.subId : undefined}
                subHref={(sub) => paths.module(mod.id, sub)}
              />
            ))}
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={route.kind === 'modules-catalog'}
                icon={<LayoutGrid />}
                render={<Link href={paths.modules} />}
                badge={
                  activeModules.length > 0 ? (
                    <SidebarMenuBadge>{activeModules.length}</SidebarMenuBadge>
                  ) : undefined
                }
              >
                All modules
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarMenu>
            {activePlugins.map((plugin) => (
              <AppNavItem
                key={plugin.id}
                item={plugin}
                href={paths.plugin(plugin.id)}
                isCurrent={currentPluginId === plugin.id}
                currentSubId={route.kind === 'plugin' ? route.subId : undefined}
                subHref={(sub) => paths.plugin(plugin.id, sub)}
              />
            ))}
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={route.kind === 'plugins-catalog'}
                icon={<Puzzle />}
                render={<Link href={paths.plugins} />}
              >
                All plugins
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={route.kind === 'audit'}
                icon={<ShieldCheck />}
                render={<Link href={paths.audit} />}
              >
                Audit trail
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={route.kind === 'api-keys'}
                icon={<KeyRound />}
                render={<Link href={paths.apiKeys} />}
              >
                API keys
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <OrganizationSwitcher collapsed={collapsed} />
      </SidebarFooter>
    </Sidebar>
  );
}

interface AppNavItemProps {
  item: CatalogItem;
  href: string;
  isCurrent: boolean;
  currentSubId?: string;
  subHref: (subId: string) => string;
}

/** A module/plugin entry; its pages expand inline while it's the current app. */
function AppNavItem({ item, href, isCurrent, currentSubId, subHref }: AppNavItemProps) {
  const Icon = appIcon(item.id);
  const firstSubId = item.subFeatures[0]?.id;
  const activeSubId = currentSubId ?? firstSubId;
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isCurrent}
        icon={<Icon />}
        render={<Link href={href} />}
        tooltip={item.name}
      >
        {item.name}
      </SidebarMenuButton>
      {isCurrent && item.subFeatures.length > 1 && (
        <SidebarMenuSub aria-label={`${item.name} pages`}>
          {item.subFeatures.map((sub) => {
            const SubIcon = pageIcon(sub.id);
            const subPath = sub.id === firstSubId ? href : subHref(sub.id);
            return (
              <SidebarMenuSubItem key={sub.id}>
                <SidebarMenuSubButton
                  isActive={activeSubId === sub.id}
                  render={<Link href={subPath} />}
                >
                  <SubIcon className="size-3.5 shrink-0 opacity-80" aria-hidden="true" />
                  <span className="truncate">{sub.label}</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            );
          })}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
}

/** Tenant / organisation switcher: a real, keyboard-operable menu. */
function OrganizationSwitcher({ collapsed }: { collapsed: boolean }) {
  const { tenantName } = useCurrentTenant();
  const { navigate } = useNavigation();
  const initial = (tenantName.trim().charAt(0) || 'O').toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={collapsed ? `${tenantName} organization menu` : undefined}
        className="flex w-full cursor-pointer items-center gap-2.5 rounded-md p-1.5 text-start text-sidebar-foreground outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-2 focus-visible:outline-sidebar-ring data-popup-open:bg-sidebar-accent"
      >
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary-soft text-sm font-semibold text-sidebar-accent-foreground"
        >
          {initial}
        </span>
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-body-sm font-medium text-sidebar-accent-foreground">
                {tenantName}
              </span>
              <span className="block truncate text-caption text-sidebar-muted-foreground">
                Organization<span className="sr-only">: open menu</span>
              </span>
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-sidebar-muted-foreground" aria-hidden="true" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuGroupLabel>{tenantName}</DropdownMenuGroupLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => navigate(paths.modules)}>Manage modules</DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate(paths.plugins)}>Manage plugins</DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate(paths.apiKeys)}>API keys</DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate(paths.audit)}>Audit trail</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
