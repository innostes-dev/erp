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
import { Home, Settings } from 'lucide-react';
import { useState } from 'react';

export default function SidebarVariantsDemo() {
  const [variant, setVariant] = useState<'sidebar' | 'floating' | 'inset'>('floating');

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <button onClick={() => setVariant('sidebar')} className={`px-3 py-1 rounded text-sm ${variant === 'sidebar' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>Sidebar</button>
        <button onClick={() => setVariant('floating')} className={`px-3 py-1 rounded text-sm ${variant === 'floating' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>Floating</button>
        <button onClick={() => setVariant('inset')} className={`px-3 py-1 rounded text-sm ${variant === 'inset' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>Inset</button>
      </div>
      <SidebarProvider className="min-h-0 h-[20rem] w-full overflow-hidden rounded-lg border border-border bg-background">
        <Sidebar variant={variant}>
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
              <SidebarMenuItem>
                <SidebarMenuButton icon={<Settings />}>
                  Settings
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-12 items-center gap-2 border-b border-border px-3 bg-background">
            <SidebarTrigger />
            <span className="text-sm">Variant: {variant}</span>
          </header>
          <main className="flex-1 p-4 text-sm text-muted-foreground bg-muted/20">
            Content area
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
