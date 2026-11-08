import { Fragment, useMemo, useState } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  CommandPalette,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Kbd,
  NotificationBell,
  SidebarTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TopBar,
  TopBarCenter,
  TopBarEnd,
  TopBarStart,
  UserMenu,
  type CommandGroup,
} from '@innostes/ui';
import { useAuth } from '@innostes/kernel';
import { CircleHelp, KeyRound, LayoutGrid, Moon, Puzzle, Search, ShieldCheck, Sun, Home } from 'lucide-react';
import { Link, useNavigation } from '../context/NavigationContext';
import { useCurrentTenant } from '../context/TenantContext';
import { useModules } from '../context/ModulesContext';
import { usePlugins } from '../context/PluginsContext';
import { paths } from '../navigation/routes';
import { appIcon, pageIcon } from '../navigation/icons';
import { useBreadcrumbs } from '../navigation/useBreadcrumbs';
import { applyTheme, readThemePreference, type ThemePreference } from '../navigation/theme';

const DOCS_URL = import.meta.env.VITE_DOCS_URL;

export function TopHeader() {
  const { user, logout } = useAuth();
  const { navigate } = useNavigation();
  const { tenantName } = useCurrentTenant();
  const { activeModules } = useModules();
  const { activePlugins } = usePlugins();
  const crumbs = useBreadcrumbs();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [theme, setTheme] = useState<ThemePreference>(readThemePreference);

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email || 'Account';
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setTheme(next);
  }

  const commandGroups = useMemo<CommandGroup[]>(() => {
    const go = (to: string) => () => navigate(to);
    const icon = (Icon: ReturnType<typeof appIcon>) => <Icon className="size-4" />;
    const appPages = (kind: 'module' | 'plugin') =>
      (kind === 'module' ? activeModules : activePlugins).flatMap((app) =>
        app.subFeatures.map((sub, index) => ({
          id: `${app.id}-${sub.id}`,
          label: `${app.name}: ${sub.label}`,
          description: sub.description,
          icon: icon(pageIcon(sub.id)),
          keywords: [app.name, sub.label],
          onSelect: go(
            kind === 'module'
              ? paths.module(app.id, index === 0 ? undefined : sub.id)
              : paths.plugin(app.id, index === 0 ? undefined : sub.id),
          ),
        })),
      );
    return [
      {
        heading: 'Go to',
        items: [
          { id: 'home', label: 'Home', icon: <Home className="size-4" />, onSelect: go(paths.home) },
          ...activeModules.map((m) => ({
            id: `module-${m.id}`,
            label: m.name,
            description: m.description,
            icon: icon(appIcon(m.id)),
            onSelect: go(paths.module(m.id)),
          })),
          ...activePlugins.map((p) => ({
            id: `plugin-${p.id}`,
            label: p.name,
            description: p.description,
            icon: icon(appIcon(p.id)),
            onSelect: go(paths.plugin(p.id)),
          })),
        ],
      },
      { heading: 'Module pages', items: [...appPages('module'), ...appPages('plugin')] },
      {
        heading: 'Administration',
        items: [
          { id: 'modules', label: 'Manage modules', icon: <LayoutGrid className="size-4" />, onSelect: go(paths.modules) },
          { id: 'plugins', label: 'Manage plugins', icon: <Puzzle className="size-4" />, onSelect: go(paths.plugins) },
          { id: 'audit', label: 'Audit trail', icon: <ShieldCheck className="size-4" />, onSelect: go(paths.audit) },
          { id: 'api-keys', label: 'API keys', icon: <KeyRound className="size-4" />, onSelect: go(paths.apiKeys) },
        ],
      },
    ];
  }, [activeModules, activePlugins, navigate]);

  return (
    <>
      <TopBar className="sticky top-0 z-30 h-14 border-b border-border bg-card">
        <TopBarStart className="min-w-0 gap-2">
          <SidebarTrigger />
          <Breadcrumb className="hidden min-w-0 sm:block">
            <BreadcrumbList>
              {crumbs.map((crumb, index) => {
                const last = index === crumbs.length - 1;
                const middle = index > 0 && !last ? 'hidden md:inline-flex' : undefined;
                return (
                  <Fragment key={crumb.label + index}>
                    <BreadcrumbItem className={middle}>
                      {last || !crumb.href ? (
                        <BreadcrumbPage className="truncate">{crumb.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink render={<Link href={crumb.href} />}>{crumb.label}</BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {!last && <BreadcrumbSeparator className={middle} />}
                  </Fragment>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
          <span className="truncate text-body-sm font-medium text-foreground sm:hidden">
            {crumbs[crumbs.length - 1]?.label}
          </span>
        </TopBarStart>

        <TopBarCenter className="hidden max-w-md flex-1 px-4 md:flex">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="flex h-9 w-full cursor-pointer items-center gap-2 rounded-md border border-border bg-canvas px-3 text-start text-body-sm text-muted-foreground transition-colors hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Search className="size-4 shrink-0" aria-hidden="true" />
            <span className="flex-1 truncate">Search pages and modules…</span>
            <Kbd>{isMac ? '⌘ K' : 'Ctrl K'}</Kbd>
          </button>
        </TopBarCenter>

        <TopBarEnd className="gap-1">
          <IconAction label="Search" className="md:hidden" onClick={() => setPaletteOpen(true)}>
            <Search />
          </IconAction>
          <NotificationBell items={[]} emptyText="You're all caught up." />
          {DOCS_URL && (
            <IconAction label="Help and documentation" onClick={() => window.open(DOCS_URL, '_blank', 'noopener')}>
              <CircleHelp />
            </IconAction>
          )}
          <IconAction label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} onClick={toggleTheme}>
            {theme === 'dark' ? <Sun /> : <Moon />}
          </IconAction>
          <div className="ms-1 h-6 w-px bg-border" aria-hidden="true" />
          <UserMenu name={fullName} subtitle={tenantName} email={user?.email || undefined} align="end">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => navigate(paths.apiKeys)}>API keys</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(paths.modules)}>Manage modules</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => void logout(false)}>Sign out</DropdownMenuItem>
              <DropdownMenuItem onClick={() => void logout(true)} className="text-error-text">
                Sign out of all devices
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </UserMenu>
        </TopBarEnd>
      </TopBar>

      <CommandPalette
        groups={commandGroups}
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        placeholder="Search pages, modules and settings…"
        label="Search INNOSTES Business OS"
      />
    </>
  );
}

/** Icon-only toolbar button with a visible tooltip and an accessible name. */
function IconAction({
  label,
  onClick,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label={label}
            onClick={onClick}
            className={`text-muted-foreground hover:text-foreground ${className ?? ''}`}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
