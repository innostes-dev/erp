'use client';

import { Button, toast } from '@innostes/ui';

const saveOrder = () =>
  new Promise<{ id: string }>((resolve, reject) =>
    setTimeout(
      () =>
        Math.random() > 0.3
          ? resolve({ id: 'ORD-1042' })
          : reject(new Error('Network error')),
      1500,
    ),
  );

export default function ToastDemo() {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <Button
        variant="outline"
        onClick={() =>
          toast('Order archived', {
            action: { label: 'Undo', onClick: () => toast('Restored') },
          })
        }
      >
        Default + action
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.success('Invoice sent', {
            description: 'Sent to billing@acme.com',
          })
        }
      >
        Success
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.error('Could not save', {
            description: 'Check your connection and try again.',
          })
        }
      >
        Error
      </Button>
      <Button
        variant="outline"
        onClick={() => toast.warning('Storage almost full')}
      >
        Warning
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.promise(saveOrder(), {
            loading: 'Saving order…',
            success: (order) => `${order.id} saved`,
            error: (err) => `Failed: ${(err as Error).message}`,
          })
        }
      >
        Promise
      </Button>
    </div>
  );
}
