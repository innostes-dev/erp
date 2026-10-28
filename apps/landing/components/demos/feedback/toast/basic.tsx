'use client';

import { Button, toast } from '@innostes/ui';

const savePurchaseOrder = () =>
  new Promise<{ id: string }>((resolve, reject) =>
    setTimeout(
      () =>
        Math.random() > 0.2
          ? resolve({ id: 'PO-8410' })
          : reject(new Error('GSTN service timed out')),
      1200,
    ),
  );

export default function ToastDemo() {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <Button
        variant="outline"
        onClick={() =>
          toast('Purchase order archived', {
            action: { label: 'Undo', onClick: () => toast.success('Order restored to active queue') },
          })
        }
      >
        Default + action
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.success('Tax invoice generated', {
            description: 'Dispatched to accounts.payable@tataconsumer.com',
          })
        }
      >
        Success
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.error('Payment reconciliation failed', {
            description: 'Bank transaction ID was not recognized.',
          })
        }
      >
        Error
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.warning('Warehouse space quota warning', {
            description: 'Depot capacity has reached 90%.',
          })
        }
      >
        Warning
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.promise(savePurchaseOrder(), {
            loading: 'Transmitting purchase order to GSTN…',
            success: (order) => `${order.id} verified and dispatched`,
            error: (err) => `Transmission failed: ${(err as Error).message}`,
          })
        }
      >
        Promise status
      </Button>
    </div>
  );
}
