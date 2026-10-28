'use client';

import { Alert, AlertDescription, AlertTitle } from '@innostes/ui';

export default function AlertDemo() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <Alert variant="info">
        <AlertTitle>GST e-way bill maintenance</AlertTitle>
        <AlertDescription>
          Scheduled server maintenance on Sunday between 02:00 and 04:00 IST. Dispatch consignments should be generated prior to this window.
        </AlertDescription>
      </Alert>
      <Alert variant="success">
        <AlertTitle>Vendor payout processed</AlertTitle>
        <AlertDescription>
          ₹14,25,000 has been transferred to Reliance Retail Ltd via RTGS transfer reference #NWT-84920.
        </AlertDescription>
      </Alert>
      <Alert variant="warning">
        <AlertTitle>Warehouse quota warning</AlertTitle>
        <AlertDescription>
          Bengaluru Central Warehouse has reached 88% capacity. Consider re-routing upcoming pallets to Whitefield Depot.
        </AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertTitle>GSTIN validation failed</AlertTitle>
        <AlertDescription>
          The vendor GSTIN checksum could not be verified against the GSTN master ledger. Please review the 15-character identifier.
        </AlertDescription>
      </Alert>
    </div>
  );
}
