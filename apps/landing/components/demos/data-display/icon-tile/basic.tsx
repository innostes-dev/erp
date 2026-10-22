'use client';

import type { ReactNode } from 'react';
import { IconTile, type IconTileTone } from '@innostes/ui';
import {
  Bell,
  Box,
  Code2,
  Cog,
  Shield,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';

const tones: { tone: IconTileTone; icon: ReactNode }[] = [
  { tone: 'chart-1', icon: <Users /> },
  { tone: 'chart-2', icon: <Code2 /> },
  { tone: 'chart-3', icon: <Shield /> },
  { tone: 'chart-4', icon: <Zap /> },
  { tone: 'chart-5', icon: <Bell /> },
  { tone: 'chart-6', icon: <Box /> },
  { tone: 'chart-7', icon: <Cog /> },
  { tone: 'chart-8', icon: <Wallet /> },
];

export default function IconTileDemo() {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-wrap justify-center gap-3">
        {tones.map((t) => (
          <IconTile key={t.tone} tone={t.tone}>
            {t.icon}
          </IconTile>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {tones.slice(0, 4).map((t) => (
          <IconTile key={t.tone} tone={t.tone} variant="solid">
            {t.icon}
          </IconTile>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <IconTile size="sm" tone="success" shape="circle">
          <Shield />
        </IconTile>
        <IconTile size="md" tone="warning">
          <Zap />
        </IconTile>
        <IconTile size="lg" tone="destructive" bordered>
          <Bell />
        </IconTile>
        <IconTile size="xl" tone="primary">
          <Users />
        </IconTile>
      </div>
    </div>
  );
}
