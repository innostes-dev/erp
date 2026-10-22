'use client';

import {
  Button,
  Checkbox,
  Field,
  FieldLabel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@innostes/ui';
import { SlidersHorizontal } from 'lucide-react';

const sorts = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'total', label: 'Highest total' },
];

export default function SheetDemo() {
  return (
    <div className="flex gap-2">
      {(['right', 'left', 'bottom'] as const).map((side) => (
        <Sheet key={side}>
          <SheetTrigger
            render={
              <Button variant="outline" startIcon={<SlidersHorizontal />} />
            }
          >
            Filters ({side})
          </SheetTrigger>
          <SheetContent side={side}>
            <SheetHeader>
              <SheetTitle>Filter orders</SheetTitle>
              <SheetDescription>
                Narrow down the list. Filters apply when you press Apply.
              </SheetDescription>
            </SheetHeader>
            <SheetBody className="flex flex-col gap-6">
              <Field>
                <FieldLabel>Sort by</FieldLabel>
                <Select items={sorts} defaultValue="newest">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sorts.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <fieldset className="flex flex-col gap-3">
                <legend className="mb-3 text-sm font-medium">Status</legend>
                {['Paid', 'Pending', 'Refunded', 'Failed'].map((s) => (
                  <label key={s} className="flex items-center gap-2 text-sm">
                    <Checkbox defaultChecked={s !== 'Failed'} /> {s}
                  </label>
                ))}
              </fieldset>
            </SheetBody>
            <SheetFooter>
              <SheetClose render={<Button variant="outline" />}>
                Reset
              </SheetClose>
              <SheetClose render={<Button />}>Apply</SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ))}
    </div>
  );
}
