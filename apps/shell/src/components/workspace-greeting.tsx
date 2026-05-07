'use client';

import { useMemo } from 'react';

interface WorkspaceGreetingProps {
  name: string;
  moduleCount: number;
}

export function WorkspaceGreeting({ name, moduleCount }: WorkspaceGreetingProps) {
  const { greeting, emoji } = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return { greeting: 'Good morning', emoji: '☀️' };
    if (hour < 17) return { greeting: 'Good afternoon', emoji: '🌤️' };
    return { greeting: 'Good evening', emoji: '🌙' };
  }, []);

  const firstName = name.split(' ')[0];

  return (
    <div className="mb-8 animate-fade-in">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">
        {greeting}, {firstName} {emoji}
      </h1>
      <p className="mt-2 text-gray-500">
        Your workspace has{' '}
        <span className="font-medium text-gray-700">{moduleCount} modules</span> ready to use.
      </p>
    </div>
  );
}
