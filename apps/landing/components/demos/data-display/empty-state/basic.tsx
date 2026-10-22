'use client';

import { Button, EmptyState } from '@innostes/ui';
import { FileText, Plus, Upload } from 'lucide-react';

export default function EmptyStateDemo() {
  return (
    <EmptyState
      className="w-full max-w-lg"
      icon={<FileText />}
      title="No invoices yet"
      description="Create your first invoice, or import existing ones from a CSV file."
      actions={
        <>
          <Button variant="outline" startIcon={<Upload />}>
            Import CSV
          </Button>
          <Button startIcon={<Plus />}>Create invoice</Button>
        </>
      }
    />
  );
}
