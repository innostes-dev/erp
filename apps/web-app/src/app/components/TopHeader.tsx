import { useState, useEffect } from 'react';
import {
  TopBar,
  TopBarStart,
  TopBarCenter,
  TopBarEnd,
  SidebarTrigger,
  SearchInput,
  NotificationBell,
  UserMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Button,
} from '@innostes/ui';
import { useAuth } from '@innostes/kernel';
import { HelpCircle, Moon, Sun } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';

export function TopHeader() {
  const { user, logout } = useAuth();
  const { navigate } = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return (
        document.documentElement.classList.contains('dark') ||
        window.matchMedia('(prefers-color-scheme: dark)').matches
      );
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  function toggleTheme() {
    setIsDark((prev) => !prev);
  }

  const sampleNotifications = [
    {
      id: '1',
      title: 'Platform update v1.2.0 ready',
      description:
        'System-wide modular architecture upgrade with plugin support.',
      time: '10m ago',
      read: false,
    },
    {
      id: '2',
      title: 'Security check passed',
      description:
        'Multi-tenant isolation and anti-enumeration defenses verified.',
      time: '1h ago',
      read: true,
    },
  ];

  const fullName =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Arun';

  return (
    <TopBar className="border-b border-border bg-background/95 backdrop-blur">
      <TopBarStart className="gap-2">
        <SidebarTrigger />
      </TopBarStart>

      <TopBarCenter className="max-w-xl flex-1 px-2">
        <div className="relative w-full">
          <SearchInput
            value={searchQuery}
            onValueChange={setSearchQuery}
            placeholder="Search modules, tools, people, documents..."
            className="w-full"
            shortcut="⌘ K"
          />
        </div>
      </TopBarCenter>

      <TopBarEnd className="gap-2">
        {/* Notifications */}
        <NotificationBell
          items={sampleNotifications}
          onMarkAllRead={() => {}}
        />

        {/* Help button */}
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          aria-label="Documentation & Help"
          onClick={() => window.open('http://localhost:3000/docs', '_blank')}
        >
          <HelpCircle className="size-4.5 text-muted-foreground" />
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          aria-label="Toggle Theme"
          onClick={toggleTheme}
        >
          {isDark ? (
            <Sun className="size-4.5 text-amber-500" />
          ) : (
            <Moon className="size-4.5 text-muted-foreground" />
          )}
        </Button>

        {/* User Menu */}
        <UserMenu
          name={fullName}
          subtitle="Acme Corp"
          email={user?.email || 'arun@acme.com'}
          align="end"
        >
          <DropdownMenuItem onClick={() => navigate('/modules')}>
            Manage Modules
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/plugins')}>
            Manage Plugins
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/administration')}>
            API Keys & Tokens
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => void logout(false)}>
            Sign out
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => void logout(true)}
            className="text-destructive"
          >
            Sign out all devices
          </DropdownMenuItem>
        </UserMenu>
      </TopBarEnd>
    </TopBar>
  );
}
