'use client';

import { useState } from 'react';
import {
  Button,
  IconTile,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  ToggleGroup,
  ToggleGroupItem,
  WidgetCard,
} from '@innostes/ui';
import {
  CalendarClock,
  ClipboardCheck,
  FileCheck2,
  ShieldCheck,
} from 'lucide-react';

const tasks = [
  {
    icon: <CalendarClock />,
    tone: 'chart-7',
    title: 'Approve leave request',
    detail: 'Suresh Reddy · 2 days',
    action: 'Review',
  },
  {
    icon: <ClipboardCheck />,
    tone: 'chart-1',
    title: 'Review timesheets',
    detail: '5 employees pending',
    action: 'Review',
  },
  {
    icon: <FileCheck2 />,
    tone: 'chart-3',
    title: 'Complete onboarding',
    detail: 'Priya Sharma',
    action: 'View',
  },
  {
    icon: <ShieldCheck />,
    tone: 'chart-4',
    title: 'Policy acknowledgment',
    detail: '3 employees pending',
    action: 'Review',
  },
] as const;

const periods = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
];

type State = 'content' | 'loading' | 'empty' | 'error';

export default function WidgetCardDemo() {
  const [state, setState] = useState<State>('content');

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <ToggleGroup
        variant="outline"
        size="sm"
        value={[state]}
        onValueChange={(v) => v[0] && setState(v[0] as State)}
        aria-label="Widget state"
      >
        {(['content', 'loading', 'empty', 'error'] as const).map((s) => (
          <ToggleGroupItem key={s} value={s}>
            {s}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <WidgetCard
        title="Pending actions"
        count={state === 'content' ? tasks.length : undefined}
        viewAll={{ href: '#widget-card' }}
        actions={
          <Select items={periods} defaultValue="week">
            <SelectTrigger size="sm" aria-label="Period" className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periods.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        loading={state === 'loading'}
        empty={state === 'empty'}
        emptyState={
          <p className="py-8 text-center text-sm text-muted-foreground">
            You're all caught up.
          </p>
        }
        error={state === 'error'}
        onRetry={() => setState('content')}
      >
        <ul className="flex flex-col gap-4">
          {tasks.map((t) => (
            <li key={t.title} className="flex items-center gap-3">
              <IconTile tone={t.tone} size="sm">
                {t.icon}
              </IconTile>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">{t.title}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {t.detail}
                </span>
              </div>
              <Button size="sm" variant="secondary">
                {t.action}
              </Button>
            </li>
          ))}
        </ul>
      </WidgetCard>
    </div>
  );
}
