'use client';

import { useState } from 'react';
import {
  Avatar,
  AvatarFallback,
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  toast,
} from '@innostes/ui';
import { ChevronDown, LogOut, Settings, User } from 'lucide-react';

export default function DropdownMenuDemo() {
  const [compact, setCompact] = useState(false);
  const [theme, setTheme] = useState('system');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" endIcon={<ChevronDown />} />}
      >
        <Avatar size="xs">
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
        Ada Lovelace
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuGroupLabel>My account</DropdownMenuGroupLabel>
          <DropdownMenuItem onClick={() => toast('Profile')}>
            <User /> Profile <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => toast('Settings')}>
            <Settings /> Settings{' '}
            <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={compact}
          onCheckedChange={setCompact}
        >
          Compact tables
        </DropdownMenuCheckboxItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Theme</DropdownMenuSubTrigger>
          <DropdownMenuContent side="right" align="start" sideOffset={-4}>
            <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
              <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">
                System
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => toast('Signed out')}
        >
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
