'use client';

import {
  Button,
  CountrySelect,
  Field,
  FieldDescription,
  FieldLabel,
  Label,
  FormActions,
  FormGrid,
  FormSection,
  Input,
  Separator,
  Switch,
  TimezoneSelect,
  toast,
} from '@innostes/ui';

export default function FormLayoutDemo() {
  return (
    <form
      className="flex w-full flex-col gap-8"
      onSubmit={(e) => {
        e.preventDefault();
        toast.success('Settings saved');
      }}
    >
      <FormSection
        layout="aside"
        title="Organization"
        description="Shown on invoices and emails."
      >
        <FormGrid>
          <Field>
            <FieldLabel required>Name</FieldLabel>
            <Input defaultValue="Acme Corporation" required />
          </Field>
          <Field>
            <FieldLabel required>Slug</FieldLabel>
            <Input defaultValue="acme" required />
            <FieldDescription>
              Used in URLs, e.g. acme.innostes.app
            </FieldDescription>
          </Field>
          <Field className="col-span-full">
            <FieldLabel>Billing email</FieldLabel>
            <Input type="email" defaultValue="billing@acme.com" />
          </Field>
        </FormGrid>
      </FormSection>

      <Separator />

      <FormSection
        layout="aside"
        title="Regional settings"
        description="Used for dates, numbers and reports."
      >
        <FormGrid>
          <div className="flex flex-col gap-2">
            <Label htmlFor="org-country">Country</Label>
            <CountrySelect id="org-country" defaultValue="IN" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="org-tz">Time zone</Label>
            <TimezoneSelect id="org-tz" defaultValue="Asia/Kolkata" />
          </div>
          <label className="col-span-full flex items-center justify-between gap-4 rounded-lg border border-border p-4">
            <span className="flex flex-col">
              <span className="text-sm font-medium">Use 24-hour time</span>
              <span className="text-xs text-muted-foreground">
                13:00 instead of 1:00 PM
              </span>
            </span>
            <Switch defaultChecked />
          </label>
        </FormGrid>
      </FormSection>

      <FormActions>
        <Button variant="outline" type="reset">
          Reset
        </Button>
        <Button type="submit">Save changes</Button>
      </FormActions>
    </form>
  );
}
