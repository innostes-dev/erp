'use client';

import { useState } from 'react';
import { Field, FieldDescription, FieldLabel } from '@innostes/ui';
import { RichTextEditor } from '@innostes/ui/editor';

const initial =
  '<h2>Delivery instructions</h2><p>Unload at <strong>Gate 3</strong> between 9 am and 5 pm.</p>' +
  '<ul><li><p>Call Ravi before arrival</p></li><li><p>Pallets must be shrink-wrapped</p></li></ul>';

export default function RichTextEditorDemo() {
  const [notes, setNotes] = useState(initial);
  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <Field>
        <FieldLabel id="rte-demo-label">Notes</FieldLabel>
        <RichTextEditor
          aria-labelledby="rte-demo-label"
          placeholder="Add notes for the warehouse team…"
          value={notes}
          onValueChange={setNotes}
        />
        <FieldDescription>Markdown shortcuts work too: **bold**, - list, ## heading.</FieldDescription>
      </Field>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">Read-only preview</span>
        <RichTextEditor aria-label="Notes preview" value={notes} readOnly className="rounded-lg border-border" />
      </div>
    </div>
  );
}
