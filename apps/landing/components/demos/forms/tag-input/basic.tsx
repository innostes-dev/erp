'use client';

import { useState } from 'react';
import { Field, FieldDescription, FieldLabel, TagInput } from '@innostes/ui';

const skills = ['Accounting', 'Excel', 'GST filing', 'Payroll', 'SAP', 'Tally', 'TypeScript'];

export default function TagInputDemo() {
  const [value, setValue] = useState(['Accounting', 'Tally']);
  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <Field>
        <FieldLabel>Skills</FieldLabel>
        <TagInput
          aria-label="Skills"
          suggestions={skills}
          value={value}
          onValueChange={setValue}
          placeholder="Add a skill…"
          max={6}
        />
        <FieldDescription>Pick from the list or type your own. Up to 6.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel>CC recipients</FieldLabel>
        <TagInput
          aria-label="CC recipients"
          placeholder="name@company.com"
          validate={(tag) => /^\S+@\S+\.\S+$/.test(tag)}
        />
        <FieldDescription>Press Enter or comma after each address, or paste a list.</FieldDescription>
      </Field>
    </div>
  );
}
