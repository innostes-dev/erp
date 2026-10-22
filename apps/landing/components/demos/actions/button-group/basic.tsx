'use client';

import { Button, ButtonGroup } from '@innostes/ui';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ButtonGroupDemo() {
  return (
    <div className="flex flex-wrap items-center gap-6">
      <ButtonGroup aria-label="Pager">
        <Button variant="outline" iconOnly aria-label="Previous">
          <ChevronLeft />
        </Button>
        <Button variant="outline">Today</Button>
        <Button variant="outline" iconOnly aria-label="Next">
          <ChevronRight />
        </Button>
      </ButtonGroup>

      <ButtonGroup aria-label="Save options">
        <Button>Save</Button>
        <Button
          iconOnly
          aria-label="More save options"
          className="border-s border-s-primary-foreground/20"
        >
          <ChevronDown />
        </Button>
      </ButtonGroup>
    </div>
  );
}
