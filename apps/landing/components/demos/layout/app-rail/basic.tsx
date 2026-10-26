'use client';

import {
  AppRail,
  AppRailItem,
  AppRailHeader,
  AppRailFooter,
  AppRailSeparator,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  Avatar,
  AvatarFallback,
} from '@innostes/ui';
import { Building, Users, Home, Settings, Briefcase, Calendar } from 'lucide-react';
import { useState } from 'react';

export default function AppRailDemo() {
  const [activeRail, setActiveRail] = useState('hrms');

  return (
    <SidebarProvider className="min-h-0 h-[28rem] w-full overflow-hidden rounded-lg border border-border">
      <AppRail>
        <AppRailHeader>
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
            A
          </div>
        </AppRailHeader>
        <AppRailItem
          icon={<Home />}
          label="Home"
          isActive={activeRail === 'home'}
          onClick={() => setActiveRail('home')}
        />
        <AppRailSeparator />
        <AppRailItem
          icon={<Building />}
          label="ERP"
          isActive={activeRail === 'erp'}
          onClick={() => setActiveRail('erp')}
        />
        <AppRailItem
          icon={<Users />}
          label="HRMS"
          isActive={activeRail === 'hrms'}
          onClick={() => setActiveRail('hrms')}
        />
        <AppRailItem
          icon={<Briefcase />}
          label="Recruitment"
          isActive={activeRail === 'recruitment'}
          onClick={() => setActiveRail('recruitment')}
          badge={3}
        />
        <AppRailFooter>
          <AppRailItem
            icon={<Settings />}
            label="Settings"
          />
          <AppRailItem
            icon={<Avatar size="sm"><AvatarFallback>US</AvatarFallback></Avatar>}
            label="Profile"
          />
        </AppRailFooter>
      </AppRail>
      <Sidebar>
        <SidebarHeader className="h-12 flex items-center px-4 font-semibold text-lg">
          {activeRail.toUpperCase()}
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarMenu>
              {activeRail === 'hrms' && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton icon={<Users />} isActive>Directory</SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton icon={<Calendar />}>Time Off</SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
              {activeRail === 'erp' && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton icon={<Building />} isActive>Dashboard</SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-12 items-center gap-2 border-b border-border px-3">
          <SidebarTrigger />
          <span className="text-sm font-medium">Page Title</span>
        </header>
        <main className="flex-1 p-4 text-sm text-muted-foreground">
          AppRail provides two-level navigation. Choose a module from the rail to change the sidebar contents.
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
