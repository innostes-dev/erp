'use client';

import { WelcomeBanner, Button, toast } from '@innostes/ui';
import { PlusCircle, FileSpreadsheet } from 'lucide-react';

export default function WelcomeBannerDemo() {
  return (
    <WelcomeBanner
      eyebrow="Fiscal Year 2026-27 · Bengaluru Division"
      title="Welcome back, Priya Sharma"
      description="You have 3 purchase orders pending approval and 1 GST filing discrepancy to resolve."
      variant="gradient"
      quote="Integrity in procurement delivers resilience in supply."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            startIcon={<PlusCircle className="size-4" />}
            onClick={() => toast.success('New PO draft created')}
          >
            Create PO
          </Button>
          <Button
            size="sm"
            variant="outline"
            startIcon={<FileSpreadsheet className="size-4" />}
            onClick={() => toast.info('Exporting GSTR-1 reconciliation')}
          >
            Export tax report
          </Button>
        </div>
      }
    />
  );
}
