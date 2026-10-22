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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        Edit profile
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Changes are visible to everyone in your workspace.
          </DialogDescription>
        </DialogHeader>
        <Form
          onFormSubmit={() => {
            setOpen(false);
            toast.success('Profile updated');
          }}
        >
          <Field name="name">
            <FieldLabel>Name</FieldLabel>
            <Input defaultValue="Ada Lovelace" required />
          </Field>
          <Field name="title">
            <FieldLabel>Job title</FieldLabel>
            <Input defaultValue="Head of Engineering" />
          </Field>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
