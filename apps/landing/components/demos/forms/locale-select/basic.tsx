'use client';

import {
  CountrySelect,
  CurrencySelect,
  DateFormatSelect,
  FormGrid,
  Label,
  LanguageSelect,
  TimezoneSelect,
} from '@innostes/ui';

export default function LocaleSelectDemo() {
  return (
    <FormGrid className="w-full max-w-2xl">
      <div className="flex flex-col gap-2">
        <Label htmlFor="country">Country / Region</Label>
        <CountrySelect
          id="country"
          name="country"
          defaultValue="IN"
          priority={['IN', 'US', 'GB', 'AE']}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="tz">Time zone</Label>
        <TimezoneSelect id="tz" name="timeZone" defaultValue="Asia/Kolkata" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="lang">Default language</Label>
        <LanguageSelect id="lang" name="language" defaultValue="en-IN" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="currency">Currency</Label>
        <CurrencySelect
          id="currency"
          name="currency"
          defaultValue="INR"
          priority={['INR', 'USD', 'EUR']}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="date-format">Date format</Label>
        <DateFormatSelect
          id="date-format"
          name="dateFormat"
          defaultValue="DD/MM/YYYY"
        />
      </div>
    </FormGrid>
  );
}
