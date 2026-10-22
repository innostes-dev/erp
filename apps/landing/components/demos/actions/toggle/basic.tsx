'use client';

import { Toggle } from '@innostes/ui';
import { Bold, Italic, Star } from 'lucide-react';

export default function ToggleDemo() {
  return (
    <div className="flex items-center gap-2">
      <Toggle aria-label="Bold" defaultPressed>
        <Bold />
      </Toggle>
      <Toggle aria-label="Italic">
        <Italic />
      </Toggle>
      <Toggle variant="outline" aria-label="Favourite">
        <Star /> Favourite
      </Toggle>
    </div>
  );
}
