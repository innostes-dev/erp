'use client';

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
} from '@innostes/ui';

export default function FieldDemo() {
  return (
    <Field className="w-full max-w-sm">
      <FieldLabel required>Work email</FieldLabel>
      <Input type="email" placeholder="ada@acme.com" required />
      <FieldDescription>We&apos;ll send the invitation here.</FieldDescription>
      <FieldError />
    </Field>
  );
}
