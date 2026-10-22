'use client';

import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@innostes/ui';
import { UserPlus } from 'lucide-react';

const members = [
  { name: 'Ada Lovelace', email: 'ada@acme.com', role: 'Owner' },
  { name: 'Grace Hopper', email: 'grace@acme.com', role: 'Admin' },
  { name: 'Alan Turing', email: 'alan@acme.com', role: 'Member' },
];

export default function CardDemo() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Team members</CardTitle>
        <CardDescription>People with access to this workspace.</CardDescription>
        <CardAction>
          <Button size="sm" variant="outline" startIcon={<UserPlus />}>
            Invite
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {members.map((m) => (
          <div key={m.email} className="flex items-center gap-3">
            <Avatar size="sm">
              <AvatarFallback>
                {m.name
                  .split(' ')
                  .map((p) => p[0])
                  .join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium">{m.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {m.email}
              </span>
            </div>
            <Badge variant={m.role === 'Owner' ? 'default' : 'secondary'}>
              {m.role}
            </Badge>
          </div>
        ))}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        3 of 10 seats used
      </CardFooter>
    </Card>
  );
}
