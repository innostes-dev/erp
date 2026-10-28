'use client';

import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Field,
  FieldLabel,
  Form,
  Input,
  toast,
} from '@innostes/ui';

export default function DialogDemo() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSaving(false);
    setOpen(false);
    toast.success('Procurement profile updated');
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && setOpen(next)}>
      <DialogTrigger render={<Button variant="outline" />}>
        Edit procurement profile
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit procurement profile</DialogTitle>
          <DialogDescription>
            Update buyer details for Northwind Traders Bengaluru division.
          </DialogDescription>
        </DialogHeader>
        <Form onFormSubmit={handleSubmit}>
          <div className="flex flex-col gap-4 py-2">
            <Field name="name">
              <FieldLabel>Buyer name</FieldLabel>
              <Input defaultValue="Priya Sharma" required disabled={saving} />
            </Field>
            <Field name="department">
              <FieldLabel>Department</FieldLabel>
              <Input defaultValue="Supply Chain & Procurement" disabled={saving} />
            </Field>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={saving} />}>
              Cancel
            </DialogClose>
            <Button type="submit" loading={saving}>
              Save changes
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
