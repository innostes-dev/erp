'use client';

import { useState } from 'react';
import {
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Fieldset,
  FieldsetLegend,
  Form,
  Input,
  toast,
} from '@innostes/ui';

export default function FormDemo() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function submit(values: Record<string, unknown>) {
    setSaving(true);
    // Simulate a server that rejects one username.
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    if (values.username === 'admin') {
      setErrors({ username: 'That username is taken.' });
      return;
    }
    setErrors({});
    toast.success('Account created', {
      description: `Welcome, ${String(values.username)}.`,
    });
  }

  return (
    <Form errors={errors} onFormSubmit={submit} className="w-full max-w-sm">
      <Fieldset>
        <FieldsetLegend>Create account</FieldsetLegend>

        <Field name="username">
          <FieldLabel required>Username</FieldLabel>
          <Input required minLength={3} autoComplete="username" />
          <FieldDescription>
            Try &quot;admin&quot; to see a server error.
          </FieldDescription>
          <FieldError match="valueMissing">Enter a username.</FieldError>
          <FieldError match="tooShort">Use at least 3 characters.</FieldError>
          <FieldError match="customError" />
        </Field>

        <Field
          name="email"
          validate={(value) =>
            String(value).endsWith('@example.com')
              ? 'Use your work email, not example.com.'
              : null
          }
        >
          <FieldLabel required>Email</FieldLabel>
          <Input type="email" required autoComplete="email" />
          <FieldError />
        </Field>
      </Fieldset>

      <Button type="submit" loading={saving} loadingText="Creating…">
        Create account
      </Button>
    </Form>
  );
}
