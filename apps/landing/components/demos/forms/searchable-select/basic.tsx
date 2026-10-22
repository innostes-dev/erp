'use client';

import { useState } from 'react';
import {
  Avatar,
  AvatarFallback,
  Field,
  FieldLabel,
  SearchableSelect,
} from '@innostes/ui';

const people = [
  { id: 'u1', name: 'Ada Lovelace', team: 'Engineering' },
  { id: 'u2', name: 'Grace Hopper', team: 'Engineering' },
  { id: 'u3', name: 'Katherine Johnson', team: 'Finance' },
  { id: 'u4', name: 'Alan Turing', team: 'Research' },
  { id: 'u5', name: 'Radia Perlman', team: 'Infrastructure' },
  { id: 'u6', name: 'Margaret Hamilton', team: 'Engineering' },
];

const initials = (name: string) =>
  name
    .split(' ')
    .map((p) => p[0])
    .join('');

export default function SearchableSelectDemo() {
  const [owner, setOwner] = useState<string | null>('u3');

  const options = people.map((p) => ({
    value: p.id,
    label: p.name,
    keywords: [p.team],
    trailing: p.team,
    leading: (
      <Avatar size="xs">
        <AvatarFallback>{initials(p.name)}</AvatarFallback>
      </Avatar>
    ),
  }));

  return (
    <Field className="w-full max-w-xs">
      <FieldLabel>Account owner</FieldLabel>
      <SearchableSelect
        options={options}
        value={owner}
        onValueChange={setOwner}
        placeholder="Search people or teams…"
        name="ownerId"
      />
    </Field>
  );
}
