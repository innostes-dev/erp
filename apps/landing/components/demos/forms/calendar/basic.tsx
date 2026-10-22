'use client';

import { useState } from 'react';
import { Calendar, type DateRange } from '@innostes/ui';

const isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6;

export default function CalendarDemo() {
  const [date, setDate] = useState<Date | null>(new Date());
  const [range, setRange] = useState<DateRange>({ from: null, to: null });

  return (
    <div className="flex flex-wrap items-start justify-center gap-6">
      <div className="rounded-xl border border-border">
        <Calendar
          value={date}
          onValueChange={setDate}
          isDateDisabled={isWeekend}
        />
      </div>
      <div className="rounded-xl border border-border">
        <Calendar
          mode="range"
          numberOfMonths={2}
          value={range}
          onValueChange={setRange}
          min={new Date()}
        />
      </div>
    </div>
  );
}
