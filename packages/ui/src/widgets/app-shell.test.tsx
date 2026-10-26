import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  AppRail,
  AppRailItem,
  AppSwitcher,
  CommandPalette,
  DropdownMenuItem,
  NotificationBell,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupAction,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
  TopBar,
  TopBarEnd,
  TopBarStart,
  UserMenu,
} from '@innostes/ui';

describe('Sidebar customisation', () => {
  function Shell(props: { variant?: 'sidebar' | 'floating' | 'inset'; collapsible?: 'icon' | 'offcanvas' | 'none'; side?: 'left' | 'right' }) {
    return (
      <SidebarProvider width="18rem" iconWidth="4rem">
        <Sidebar {...props}>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupAction aria-label="Add project">+</SidebarGroupAction>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive>Payroll</SidebarMenuButton>
                  <SidebarMenuBadge>3</SidebarMenuBadge>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton href="/payroll/runs" isActive>
                        Runs
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <SidebarTrigger />
        </SidebarInset>
      </SidebarProvider>
    );
  }

  it('exposes width variables and variant/side attributes', () => {
    const { container } = render(<Shell variant="floating" side="right" />);
    const provider = container.querySelector<HTMLElement>('[data-slot=sidebar-provider]')!;
    expect(provider.style.getPropertyValue('--sidebar-width')).toBe('18rem');
    expect(provider.style.getPropertyValue('--sidebar-width-icon')).toBe('4rem');
    const aside = container.querySelector('[data-slot=sidebar]')!;
    expect(aside).toHaveAttribute('data-variant', 'floating');
    expect(aside).toHaveAttribute('data-side', 'right');
  });

  it('renders sub-menus, badges and group actions', () => {
    render(<Shell />);
    expect(screen.getByRole('link', { name: 'Runs' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('3')).toHaveAttribute('data-slot', 'sidebar-menu-badge');
    expect(screen.getByRole('button', { name: 'Add project' })).toBeInTheDocument();
  });

  it('collapses to icons or off-canvas, and never with collapsible="none"', async () => {
    const { container, rerender } = render(<Shell collapsible="offcanvas" />);
    const aside = () => container.querySelector('[data-slot=sidebar]')!;
    await userEvent.click(screen.getByRole('button', { name: 'Toggle sidebar' }));
    expect(aside()).toHaveAttribute('data-collapsible', 'offcanvas');
    rerender(<Shell collapsible="none" />);
    expect(aside()).toHaveAttribute('data-state', 'expanded');
  });
});

describe('AppRail and TopBar', () => {
  it('renders labelled rail items with an active state and badge', () => {
    render(
      <AppRail>
        <AppRailItem icon={<span />} label="Home" isActive />
        <AppRailItem icon={<span />} label="Inbox" badge={4} />
      </AppRail>,
    );
    const nav = screen.getByRole('navigation', { name: 'Apps' });
    expect(within(nav).getByRole('button', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByLabelText('4 new')).toBeInTheDocument();
  });

  it('lays out a top bar', () => {
    render(
      <TopBar>
        <TopBarStart>Logo</TopBarStart>
        <TopBarEnd>User</TopBarEnd>
      </TopBar>,
    );
    expect(screen.getByRole('banner')).toHaveTextContent('LogoUser');
  });
});

describe('CommandPalette', () => {
  const run = { orders: vi.fn(), invoice: vi.fn() };
  const groups = [
    { heading: 'Pages', items: [{ id: 'orders', label: 'Orders', keywords: ['sales'], onSelect: run.orders }] },
    { heading: 'Actions', items: [{ id: 'invoice', label: 'Create invoice', onSelect: run.invoice }] },
  ];

  it('opens with Ctrl+K, filters, and runs the highlighted command with Enter', async () => {
    render(<CommandPalette groups={groups} />);
    await userEvent.keyboard('{Control>}k{/Control}');
    const input = await screen.findByRole('combobox', { name: 'Command palette' });
    expect(screen.getAllByRole('option')).toHaveLength(2);
    await userEvent.type(input, 'sales');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByRole('option', { name: 'Orders' })).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{Enter}');
    expect(run.orders).toHaveBeenCalled();
  });

  it('moves with the arrow keys and shows an empty state', async () => {
    render(<CommandPalette groups={groups} defaultOpen />);
    const input = await screen.findByRole('combobox');
    await userEvent.keyboard('{ArrowDown}');
    expect(input).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'Create invoice' }).id);
    await userEvent.type(input, 'zzz');
    expect(screen.getByText('No results found.')).toBeInTheDocument();
  });
});

describe('AppSwitcher', () => {
  it('shows the current app and switches', async () => {
    const onValueChange = vi.fn();
    render(
      <AppSwitcher
        defaultValue="hrms"
        onValueChange={onValueChange}
        sections={[
          {
            label: 'Modules',
            apps: [
              { id: 'erp', name: 'ERP', description: 'Business operations', icon: <span /> },
              { id: 'hrms', name: 'HRMS', description: 'People & HR', icon: <span /> },
            ],
          },
        ]}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Switch application, current: HRMS' }));
    const list = await screen.findByRole('list');
    expect(within(list).getByRole('button', { name: /^HRMS/ })).toHaveAttribute('aria-current', 'true');
    await userEvent.click(within(list).getByRole('button', { name: /^ERP/ }));
    expect(onValueChange).toHaveBeenCalledWith('erp');
  });
});

describe('NotificationBell', () => {
  it('announces unread notifications and lists them', async () => {
    const onMarkAllRead = vi.fn();
    render(
      <NotificationBell
        onMarkAllRead={onMarkAllRead}
        items={[
          { id: '1', title: 'Leave approved', time: new Date(Date.now() - 2 * 60_000) },
          { id: '2', title: 'Report ready', read: true },
        ]}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Notifications, 1 unread' }));
    expect(await screen.findByText('Leave approved')).toBeInTheDocument();
    expect(screen.getByText('Unread')).toBeInTheDocument();
    expect(screen.getByText(/2 min/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Mark all as read' }));
    expect(onMarkAllRead).toHaveBeenCalled();
  });
});

describe('UserMenu', () => {
  it('shows initials and the menu items', async () => {
    render(
      <UserMenu name="Arun Kumar" subtitle="Acme Corp" email="arun@acme.com">
        <DropdownMenuItem>Profile</DropdownMenuItem>
      </UserMenu>,
    );
    const trigger = screen.getByRole('button', { name: 'Account menu for Arun Kumar' });
    expect(trigger).toHaveTextContent('AK');
    await userEvent.click(trigger);
    expect(await screen.findByRole('menuitem', { name: 'Profile' })).toBeInTheDocument();
    expect(screen.getByText('arun@acme.com')).toBeInTheDocument();
  });
});
