import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
} from '@innostes/ui';
import {
  Home,
  LayoutGrid,
  Puzzle,
  Bookmark,
  Clock,
  Settings,
  ChevronDown,
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { useModules } from '../context/ModulesContext';
import { usePlugins } from '../context/PluginsContext';

export function SidebarNav() {
  const { path, navigate } = useNavigation();
  const { activeModuleIds } = useModules();
  const { activePluginIds } = usePlugins();

  const isHome = path === '/';
  const isModules = path.startsWith('/modules');
  const isPlugins = path.startsWith('/plugins');
  const isAdmin = path.startsWith('/administration');

  return (
    <Sidebar className="border-r border-border bg-sidebar select-none">
      {/* Brand Header */}
      <SidebarHeader className="h-16 flex items-center justify-start px-4 border-b border-sidebar-border">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-3 text-start group cursor-pointer"
        >
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
            <svg
              className="size-6 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m12 3-8 4.5v9L12 21l8-4.5v-9L12 3z" />
              <path d="M12 12 4 7.5" />
              <path d="m12 12 8-4.5" />
              <path d="M12 12v9" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-wider text-foreground">ECOSYSTEM</h1>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Platform</p>
          </div>
        </button>
      </SidebarHeader>

      {/* Main Navigation Menu */}
      <SidebarContent className="p-3">
        <SidebarMenu className="gap-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={isHome}
              icon={<Home className="size-4" />}
              onClick={() => navigate('/')}
            >
              Home
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={isModules}
              icon={<LayoutGrid className="size-4" />}
              onClick={() => navigate('/modules')}
              badge={activeModuleIds.size > 0 ? (
                <SidebarMenuBadge>{activeModuleIds.size}</SidebarMenuBadge>
              ) : undefined}
            >
              Modules
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={isPlugins}
              icon={<Puzzle className="size-4" />}
              onClick={() => navigate('/plugins')}
              badge={activePluginIds.size > 0 ? (
                <SidebarMenuBadge>{activePluginIds.size}</SidebarMenuBadge>
              ) : undefined}
            >
              Plugins
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              icon={<Bookmark className="size-4 text-muted-foreground" />}
              onClick={() => {}}
            >
              Bookmarks
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              icon={<Clock className="size-4 text-muted-foreground" />}
              onClick={() => {}}
            >
              Recent
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={isAdmin}
              icon={<Settings className="size-4" />}
              onClick={() => navigate('/administration')}
            >
              Administration
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      {/* Tenant Footer */}
      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <div className="flex items-center justify-between rounded-xl p-2.5 hover:bg-sidebar-accent/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-sm shadow-xs">
              A
            </div>
            <div className="truncate">
              <p className="text-sm font-semibold text-foreground truncate">Acme Corporation</p>
              <p className="text-xs text-muted-foreground truncate">Enterprise Plan</p>
            </div>
          </div>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
