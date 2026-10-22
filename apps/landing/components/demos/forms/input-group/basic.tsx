'use client';

import {
  Button,
  Field,
  FieldLabel,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  PasswordInput,
  SearchInput,
  toast,
} from '@innostes/ui';
import { AtSign, Copy } from 'lucide-react';

export default function InputGroupDemo() {
  return (
    <div className="flex w-full max-w-md flex-col gap-5">
      <Field>
        <FieldLabel>Workspace URL</FieldLabel>
        <InputGroup>
          <InputGroupAddon>https://</InputGroupAddon>
          <InputGroupInput placeholder="acme" />
          <InputGroupAddon>.innostes.app</InputGroupAddon>
        </InputGroup>
      </Field>

      <Field>
        <FieldLabel>Price</FieldLabel>
        <InputGroup>
          <InputGroupAddon>€</InputGroupAddon>
          <InputGroupInput inputMode="decimal" placeholder="0.00" />
          <InputGroupAddon>EUR</InputGroupAddon>
        </InputGroup>
      </Field>

      <Field>
        <FieldLabel>Email</FieldLabel>
        <InputGroup>
          <InputGroupAddon variant="icon">
            <AtSign />
          </InputGroupAddon>
          <InputGroupInput type="email" placeholder="ada@acme.com" />
          <InputGroupAddon variant="icon" className="pe-1">
            <Button
              size="sm"
              variant="ghost"
              iconOnly
              aria-label="Copy email"
              onClick={() => toast('Copied')}
            >
              <Copy />
            </Button>
          </InputGroupAddon>
        </InputGroup>
      </Field>

      <Field>
        <FieldLabel>Search</FieldLabel>
        <SearchInput
          placeholder="Search employees, modules, documents…"
          shortcut="⌘K"
        />
      </Field>

      <Field>
        <FieldLabel>Password</FieldLabel>
        <PasswordInput autoComplete="new-password" />
      </Field>
    </div>
  );
}
