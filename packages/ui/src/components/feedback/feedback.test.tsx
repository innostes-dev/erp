import { describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { Alert, AlertDescription, AlertTitle } from '@innostes/ui';
import { Meter } from '@innostes/ui';
import { Progress } from '@innostes/ui';
import { Skeleton } from '@innostes/ui';
import { Spinner } from '@innostes/ui';
import { Toaster, toast } from '@innostes/ui';

describe('Alert', () => {
    it('uses role="alert" for urgent variants and status otherwise', () => {
        const { rerender } = render(
            <Alert variant="destructive">
                <AlertTitle>Payment failed</AlertTitle>
                <AlertDescription>Check your card.</AlertDescription>
            </Alert>,
        );
        expect(screen.getByRole('alert')).toHaveTextContent('Payment failed');
        rerender(<Alert variant="info">FYI</Alert>);
        expect(screen.getByRole('status')).toHaveTextContent('FYI');
    });

    it('can hide the icon', () => {
        const { container } = render(<Alert icon={null}>Plain</Alert>);
        expect(container.querySelector('[data-slot=alert-icon]')).toBeNull();
    });
});

describe('Progress and Meter', () => {
    it('exposes progressbar values', () => {
        render(<Progress value={40} aria-label="Upload" />);
        expect(screen.getByRole('progressbar', { name: 'Upload' })).toHaveAttribute(
            'aria-valuenow',
            '40',
        );
    });

    it('exposes meter values', () => {
        render(<Meter value={72} label="Storage" />);
        expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '72');
    });
});

describe('Spinner and Skeleton', () => {
    it('announces loading by default and can be silenced', () => {
        const { rerender } = render(<Spinner />);
        expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
        rerender(<Spinner label={null} />);
        expect(screen.queryByRole('status')).toBeNull();
    });

    it('hides skeletons from assistive technology', () => {
        const { container } = render(<Skeleton className="h-4" />);
        expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
    });
});

describe('toast', () => {
    it('shows toasts created outside React in the Toaster', async () => {
        render(<Toaster />);
        act(() => {
            toast.success('Invoice sent', { description: 'Sent to ada@example.com' });
        });
        expect(await screen.findByText('Invoice sent')).toBeInTheDocument();
        expect(screen.getByText('Sent to ada@example.com')).toBeInTheDocument();
        // Base UI hides the close button from assistive tech until the toast region is focused (F6).
        expect(
            document.querySelector('button[aria-label="Dismiss notification"]'),
        ).toBeInTheDocument();
        act(() => toast.dismiss());
    });
});
