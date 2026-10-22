'use client';

import { Field, FieldDescription, FieldLabel, Textarea } from '@innostes/ui';

export default function TextareaDemo() {
  return (
    <Field className="w-full max-w-md">
      <FieldLabel>Internal note</FieldLabel>
      <Textarea autoResize rows={3} placeholder="Only visible to your team…" />
      <FieldDescription>Grows as you type.</FieldDescription>
    </Field>
  );
}
