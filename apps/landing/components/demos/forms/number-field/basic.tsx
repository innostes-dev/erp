'use client';

import { Field, FieldLabel, FieldDescription, NumberField } from '@innostes/ui';

export default function NumberFieldDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <Field>
        <FieldLabel>Order quantity (units)</FieldLabel>
        <NumberField defaultValue={25} min={1} max={500} step={5} />
        <FieldDescription>Stepping increments by 5 units.</FieldDescription>
      </Field>

      <Field>
        <FieldLabel>Unit rate (INR)</FieldLabel>
        <NumberField
          defaultValue={1450.5}
          step={50}
          locale="en-IN"
          format={{ style: 'currency', currency: 'INR' }}
        />
        <FieldDescription>Formatted in en-IN with Rupee symbol and Indian numbering.</FieldDescription>
      </Field>

      <Field>
        <FieldLabel>Applicable GST rate</FieldLabel>
        <NumberField
          defaultValue={0.18}
          min={0}
          max={0.28}
          step={0.01}
          locale="en-IN"
          format={{ style: 'percent' }}
        />
        <FieldDescription>Standard GST slab (18%).</FieldDescription>
      </Field>
    </div>
  );
}
