'use client';

import { UserMenu, DropdownMenuItem, DropdownMenuSeparator } from '@innostes/ui';
import { User, Settings, LogOut } from 'lucide-react';

export default function UserMenuDemo() {
  return (
    <div className="flex items-center justify-center p-12">
      <UserMenu
        name="Ada Lovelace"
        subtitle="Administrator"
        email="ada@example.com"
      >
        <DropdownMenuItem>
          <User className="mr-2" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => alert('Signing out...')}>
          <LogOut className="mr-2" />
          Sign out
        </DropdownMenuItem>
      </UserMenu>
    </div>
  );
}
