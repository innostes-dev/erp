'use client';

import { Alert, AlertDescription, AlertTitle } from '@innostes/ui';

export default function AlertDemo() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <Alert>
        <AlertTitle>New version available</AlertTitle>
        <AlertDescription>
          Reload the page to get the latest features.
        </AlertDescription>
      </Alert>
      <Alert variant="info">
        <AlertTitle>Scheduled maintenance</AlertTitle>
        <AlertDescription>
          Sunday 02:00–04:00 CET. Exports are paused during this window.
        </AlertDescription>
      </Alert>
      <Alert variant="success">
        <AlertTitle>Payout sent</AlertTitle>
        <AlertDescription>
          €12,480.00 is on its way to your bank account.
        </AlertDescription>
      </Alert>
      <Alert variant="warning">
        <AlertTitle>Your trial ends in 3 days</AlertTitle>
        <AlertDescription>
          Add a payment method to keep your data.
        </AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertTitle>Payment failed</AlertTitle>
        <AlertDescription>
          The card ending 4242 was declined. Update it to avoid interruption.
        </AlertDescription>
      </Alert>
    </div>
  );
}
