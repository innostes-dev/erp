'use client';

import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from '@innostes/ui';

const team = [
  'Priya Sharma',
  'Rajesh Nair',
  'Ananya Rao',
  'Vikram Patel',
  'Deepa Menon',
];

const initials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('');

export default function AvatarDemo() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-8">
      <div className="flex items-center gap-3">
        <Avatar size="xs">
          <AvatarFallback>PS</AvatarFallback>
        </Avatar>
        <Avatar size="sm">
          <AvatarFallback>RN</AvatarFallback>
        </Avatar>
        <Avatar size="md">
          <AvatarImage src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=face" alt="Priya Sharma" />
          <AvatarFallback>PS</AvatarFallback>
        </Avatar>
        <Avatar size="lg" shape="square">
          <AvatarFallback>NW</AvatarFallback>
        </Avatar>
      </div>

      <AvatarGroup max={3}>
        {team.map((name) => (
          <Avatar key={name} title={name}>
            <AvatarFallback>{initials(name)}</AvatarFallback>
          </Avatar>
        ))}
      </AvatarGroup>
    </div>
  );
}
