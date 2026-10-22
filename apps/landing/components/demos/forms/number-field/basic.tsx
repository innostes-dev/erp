'use client';

import { Field, FieldLabel, NumberField } from '@innostes/ui';

export default function NumberFieldDemo() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-4">
      <Field>
        <FieldLabel>Quantity</FieldLabel>
        <NumberField defaultValue={1} min={1} max={99} />
      </Field>
      <Field>
        <FieldLabel>Unit price</FieldLabel>
        <NumberField
          defaultValue={1999.5}
          step={0.5}
          showSteppers={false}
          format={{ style: 'currency', currency: 'EUR' }}
        />
      </Field>
    </div>
  );
}
