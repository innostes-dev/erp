'use client';

import {
  Button,
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
  Field,
  FieldLabel,
  Input,
} from '@innostes/ui';
import { ChevronDown } from 'lucide-react';

export default function CollapsibleDemo() {
  return (
    <Collapsible className="w-full max-w-sm">
      <CollapsibleTrigger
        render={<Button variant="ghost" size="sm" className="group -ms-3" />}
      >
        Advanced options
        <ChevronDown className="transition-transform group-data-panel-open:rotate-180" />
      </CollapsibleTrigger>
      <CollapsiblePanel>
        <div className="flex flex-col gap-4 pt-3">
          <Field>
            <FieldLabel>Webhook URL</FieldLabel>
            <Input placeholder="https://" />
          </Field>
          <Field>
            <FieldLabel>Retry attempts</FieldLabel>
            <Input type="number" defaultValue={3} />
          </Field>
        </div>
      </CollapsiblePanel>
    </Collapsible>
  );
}
