'use client';

import {
  Button,
  Input,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
  toast,
} from '@innostes/ui';
import { Copy, Share2 } from 'lucide-react';

const link = 'https://app.innostes.com/r/ORD-1042';

export default function PopoverDemo() {
  return (
    <Popover>
      <PopoverTrigger
        render={<Button variant="outline" startIcon={<Share2 />} />}
      >
        Share
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <PopoverTitle>Share order</PopoverTitle>
        <PopoverDescription>
          Anyone with the link can view this order.
        </PopoverDescription>
        <div className="mt-3 flex gap-2">
          <Input size="sm" readOnly value={link} aria-label="Share link" />
          <Button
            size="sm"
            variant="secondary"
            iconOnly
            aria-label="Copy link"
            onClick={async () => {
              await navigator.clipboard.writeText(link);
              toast.success('Link copied');
            }}
          >
            <Copy />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
