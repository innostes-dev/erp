'use client';

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  Field,
  FieldLabel,
} from '@innostes/ui';

const countries = [
  'Australia',
  'Austria',
  'Belgium',
  'Brazil',
  'Canada',
  'Denmark',
  'Finland',
  'France',
  'Germany',
  'India',
  'Ireland',
  'Italy',
  'Japan',
  'Netherlands',
  'New Zealand',
  'Norway',
  'Portugal',
  'Singapore',
  'Spain',
  'Sweden',
  'Switzerland',
  'United Kingdom',
  'United States',
];

export default function ComboboxDemo() {
  return (
    <Field className="w-full max-w-xs">
      <FieldLabel>Country</FieldLabel>
      <Combobox items={countries}>
        <ComboboxInput placeholder="Search countries…" />
        <ComboboxContent>
          <ComboboxEmpty>No country found.</ComboboxEmpty>
          <ComboboxList>
            {(country: string) => (
              <ComboboxItem key={country} value={country}>
                {country}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}
