'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
} from '@innostes/ui';
import { Home, Users, Settings } from 'lucide-react';
import { useState } from 'react';

export default function SidebarNavSubmenuDemo() {
  const [usersOpen, setUsersOpen] = useState(true);

  return (
    <SidebarProvider className="min-h-0 h-[24rem] w-full overflow-hidden rounded-lg border border-border">
      <Sidebar>
        <SidebarHeader className="h-12 flex items-center px-4 font-semibold">
          Acme Inc.
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Application</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton icon={<Home />}>Dashboard</SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  icon={<Users />}
                  isActive={usersOpen}
                  onClick={() => setUsersOpen(!usersOpen)}
                >
                  Users
                </SidebarMenuButton>
                {usersOpen && (
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton isActive>All Users</SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton>Roles</SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton>Permissions</SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton icon={<Settings />}>Settings</SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-12 items-center gap-2 border-b border-border px-3">
          <SidebarTrigger />
          <span className="text-sm">Navigation with Submenus</span>
        </header>
        <main className="flex-1 p-4 text-sm text-muted-foreground">
          Submenus are great for nested navigation hierarchies.
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
