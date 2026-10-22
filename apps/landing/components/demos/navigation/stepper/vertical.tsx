'use client';

import { Stepper } from '@innostes/ui';

export default function StepperVerticalDemo() {
  return (
    <div className="grid w-full gap-10 sm:grid-cols-2">
      <Stepper
        orientation="vertical"
        currentStep={2}
        steps={[
          { title: 'Order placed', description: 'Oct 20, 09:14' },
          { title: 'Payment confirmed', description: 'Oct 20, 09:15' },
          { title: 'Packing', description: 'In progress at Warehouse 2' },
          { title: 'Shipped' },
          { title: 'Delivered' },
        ]}
      />
      <Stepper
        orientation="vertical"
        size="sm"
        currentStep={1}
        steps={[
          { title: 'Upload file', description: 'customers.csv' },
          {
            title: 'Map columns',
            description: '2 required columns are missing',
            status: 'error',
          },
          { title: 'Import' },
        ]}
      />
    </div>
  );
}
