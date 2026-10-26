'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@innostes/ui';
import { Home } from 'lucide-react';

export default function SidebarWidthDemo() {
  return (
    <SidebarProvider
      width="20rem"
      iconWidth="4rem"
      className="min-h-0 h-[20rem] w-full overflow-hidden rounded-lg border border-border"
    >
      <Sidebar>
        <SidebarHeader className="h-12 flex items-center px-4 font-semibold">
          Acme Inc.
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton icon={<Home />} isActive>
                Dashboard
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-12 items-center gap-2 border-b border-border px-3">
          <SidebarTrigger />
          <span className="text-sm">Custom Width Sidebar (320px)</span>
        </header>
        <main className="flex-1 p-4 text-sm text-muted-foreground">
          The sidebar width is set to <code>20rem</code> and icon width to <code>4rem</code>.
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
