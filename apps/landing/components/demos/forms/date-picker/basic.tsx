'use client';

import { useState } from 'react';
import {
  DatePicker,
  DateRangePicker,
  FormGrid,
  Label,
  type DateRange,
} from '@innostes/ui';

export default function DatePickerDemo() {
  const [due, setDue] = useState<Date | null>(null);
  const [period, setPeriod] = useState<DateRange>({ from: null, to: null });

  return (
    <FormGrid className="w-full max-w-2xl">
      <div className="flex flex-col gap-2">
        <Label htmlFor="due-date">Due date</Label>
        <DatePicker
          id="due-date"
          name="dueDate"
          value={due}
          onValueChange={setDue}
          min={new Date()}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="dob">Date of birth</Label>
        <DatePicker
          id="dob"
          captionLayout="dropdown"
          max={new Date()}
          format={{ dateStyle: 'long' }}
        />
      </div>
      <div className="col-span-full flex flex-col gap-2">
        <Label htmlFor="period">Report period</Label>
        <DateRangePicker
          id="period"
          value={period}
          onValueChange={setPeriod}
          startName="from"
          endName="to"
        />
      </div>
    </FormGrid>
  );
}
