'use client';

import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  toast,
} from '@innostes/ui';
import { AlertTriangle } from 'lucide-react';

export default function AlertDialogDemo() {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button variant="destructive" startIcon={<AlertTriangle />} />}
      >
        Void tax invoice
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Void tax invoice INV-2026-081?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. Voiding will reverse ₹89,400 in accounts receivable, cancel the registered GST e-way bill, and emit a credit note.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="outline" />}>
            Cancel
          </AlertDialogClose>
          <AlertDialogClose
            render={<Button variant="destructive" />}
            onClick={() => toast.success('Tax invoice INV-2026-081 voided and credit note generated')}
          >
            Void invoice
          </AlertDialogClose>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
