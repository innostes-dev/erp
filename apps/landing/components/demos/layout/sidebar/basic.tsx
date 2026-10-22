'use client';

import {
  Avatar,
  AvatarFallback,
  Badge,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@innostes/ui';
import type { ReactNode } from 'react';
import {
  BarChart3,
  Boxes,
  FileText,
  Home,
  Settings,
  ShoppingCart,
  Users,
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: ReactNode;
  active?: boolean;
  badge?: ReactNode;
}

const nav: { label: string; items: NavItem[] }[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', icon: <Home />, active: true },
      { label: 'Reports', icon: <BarChart3 /> },
    ],
  },
  {
    label: 'Sales',
    items: [
      {
        label: 'Orders',
        icon: <ShoppingCart />,
        badge: (
          <Badge size="sm" variant="secondary">
            12
          </Badge>
        ),
      },
      { label: 'Invoices', icon: <FileText /> },
      { label: 'Customers', icon: <Users /> },
      { label: 'Products', icon: <Boxes /> },
    ],
  },
];

export default function SidebarDemo() {
  return (
    // In an app, SidebarProvider fills the screen; here it's boxed in for the preview.
    <SidebarProvider className="min-h-0 h-[28rem] w-full overflow-hidden rounded-lg border border-border">
      <Sidebar className="h-full">
        <SidebarHeader>
          <div className="flex h-9 items-center gap-2 overflow-hidden px-1.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
              A
            </span>
            <span className="truncate text-sm font-semibold">Acme Inc.</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          {nav.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      icon={item.icon}
                      isActive={item.active}
                      badge={item.badge}
                    >
                      {item.label}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton icon={<Settings />}>
                Settings
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                icon={
                  <Avatar size="xs">
                    <AvatarFallback>AL</AvatarFallback>
                  </Avatar>
                }
                tooltip="Ada Lovelace"
              >
                Ada Lovelace
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-12 items-center gap-2 border-b border-border px-3">
          <SidebarTrigger />
          <span className="text-sm font-medium">Dashboard</span>
          <span className="ms-auto hidden text-xs text-muted-foreground sm:inline">
            Ctrl/⌘ + B toggles the sidebar
          </span>
        </header>
        <main className="flex-1 p-4 text-sm text-muted-foreground">
          Page content
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
