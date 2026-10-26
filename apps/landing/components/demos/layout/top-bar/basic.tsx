'use client';

import {
  TopBar,
  TopBarStart,
  TopBarCenter,
  TopBarEnd,
  SearchInput,
  Button,
  SidebarTrigger,
  NotificationBell,
  UserMenu,
} from '@innostes/ui';

export default function TopBarDemo() {
  return (
    <div className="w-full h-48 border border-border rounded-lg bg-muted/20 overflow-hidden relative">
      <TopBar sticky blur className="absolute top-0 w-full border-b-0 shadow-sm">
        <TopBarStart>
          <div className="flex h-8 items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded bg-primary text-xs font-bold text-primary-foreground">
              A
            </span>
            <span className="hidden font-bold sm:inline-block">Acme</span>
          </div>
        </TopBarStart>
        <TopBarCenter>
          <div className="w-full max-w-sm">
            <SearchInput placeholder="Search..." />
          </div>
        </TopBarCenter>
        <TopBarEnd>
          <NotificationBell items={[]} unreadCount={2} />
          <UserMenu name="Ada Lovelace" initials="AL" />
        </TopBarEnd>
      </TopBar>
      <div className="p-4 pt-20 text-sm text-muted-foreground">
        Top bar stays sticky at the top. Scroll down to see the blur effect if `blur` is enabled.
        <div className="h-64 mt-4 bg-muted/50 rounded-lg p-4">Scrollable content</div>
      </div>
    </div>
  );
}
