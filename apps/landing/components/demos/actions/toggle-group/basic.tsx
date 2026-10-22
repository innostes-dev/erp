'use client';

import { ToggleGroup, ToggleGroupItem } from '@innostes/ui';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  LayoutGrid,
  List,
} from 'lucide-react';

export default function ToggleGroupDemo() {
  return (
    <div className="flex flex-wrap items-center gap-6">
      {/* Single choice */}
      <ToggleGroup defaultValue={['left']} aria-label="Text alignment">
        <ToggleGroupItem value="left" aria-label="Align left">
          <AlignLeft />
        </ToggleGroupItem>
        <ToggleGroupItem value="center" aria-label="Align center">
          <AlignCenter />
        </ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Align right">
          <AlignRight />
        </ToggleGroupItem>
      </ToggleGroup>

      {/* Attached outline style */}
      <ToggleGroup variant="outline" defaultValue={['list']} aria-label="View">
        <ToggleGroupItem value="list">
          <List /> List
        </ToggleGroupItem>
        <ToggleGroupItem value="grid">
          <LayoutGrid /> Grid
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
