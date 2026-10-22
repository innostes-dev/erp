'use client';

import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from '@innostes/ui';

const team = [
  'Ada Lovelace',
  'Grace Hopper',
  'Alan Turing',
  'Katherine Johnson',
  'Linus Torvalds',
];
const initials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('');

export default function AvatarDemo() {
  return (
    <div className="flex flex-wrap items-center gap-8">
      <div className="flex items-center gap-3">
        <Avatar size="xs">
          <AvatarFallback>XS</AvatarFallback>
        </Avatar>
        <Avatar size="sm">
          <AvatarFallback>SM</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarImage src="https://i.pravatar.cc/80?img=47" alt="" />
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
        <Avatar size="lg" shape="square">
          <AvatarFallback>AC</AvatarFallback>
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
