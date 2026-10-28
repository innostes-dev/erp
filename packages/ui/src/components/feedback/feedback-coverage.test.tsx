import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Gauge,
  Meter,
  Progress,
  Skeleton,
  Spinner,
  Toaster,
  toast,
} from '@innostes/ui';

describe('Meter and Progress percent format normalization', () => {
  it('formats Meter value 72 with style: percent as 72%, not 7,200%', () => {
    render(
      <Meter
        value={72}
        label="Disk Usage"
        format={{ style: 'percent' }}
        data-testid="disk-meter"
      />,
    );
    const meter = screen.getByRole('meter', { name: 'Disk Usage' });
    expect(meter).toHaveAttribute('aria-valuenow', '72');
    expect(meter).toHaveAttribute('aria-valuetext', '72%');
    expect(screen.getByText('72%')).toBeInTheDocument();
  });

  it('formats Progress value 45 with style: percent as 45%', () => {
    render(
      <Progress
        value={45}
        label="Download"
        format={{ style: 'percent' }}
        showValue
      />,
    );
    const progress = screen.getByRole('progressbar', { name: 'Download' });
    expect(progress).toHaveAttribute('aria-valuenow', '45');
    expect(progress).toHaveAttribute('aria-valuetext', '45%');
    expect(screen.getByText('45%')).toBeInTheDocument();
  });

  it('formats Meter with custom range and fraction digits', () => {
    render(
      <Meter
        value={150}
        min={100}
        max={200}
        label="Bandwidth"
        format={{ style: 'percent', minimumFractionDigits: 1 }}
      />,
    );
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', '50.0%');
    expect(screen.getByText('50.0%')).toBeInTheDocument();
  });

  it('formats Gauge correctly matching percent behavior', () => {
    render(
      <Gauge
        value={80}
        label="Memory"
        format={{ style: 'percent' }}
        data-testid="mem-gauge"
      />,
    );
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', '80%');
    expect(screen.getByText('80%')).toBeInTheDocument();
  });
});

describe('Toast advanced lifecycle and accessibility', () => {
  it('supports toast.promise lifecycle', async () => {
    render(<Toaster position="bottom-end" closeLabel="Close toast" />);

    let resolvePromise!: (val: string) => void;
    const testPromise = new Promise<string>((resolve) => {
      resolvePromise = resolve;
    });

    act(() => {
      toast.promise(testPromise, {
        loading: 'Saving changes…',
        success: (val) => `Saved: ${val}`,
        error: 'Failed to save',
      });
    });

    expect(screen.getByText('Saving changes…')).toBeInTheDocument();

    await act(async () => {
      resolvePromise('Invoice #1042');
    });

    expect(await screen.findByText('Saved: Invoice #1042')).toBeInTheDocument();
    act(() => toast.dismiss());
  });

  it('supports toast action button and custom closeLabel', async () => {
    const handleAction = vi.fn();
    render(<Toaster position="top-start" closeLabel="Dismiss alert" />);

    act(() => {
      toast('Item archived', {
        action: { label: 'Undo action', onClick: handleAction },
      });
    });

    const actionBtn = await screen.findByRole('button', { name: 'Undo action' });
    expect(actionBtn).toBeInTheDocument();
    await userEvent.click(actionBtn);
    expect(handleAction).toHaveBeenCalledTimes(1);

    const closeBtn = screen.getByRole('button', { name: 'Dismiss alert' });
    expect(closeBtn).toBeInTheDocument();
    await userEvent.click(closeBtn);
  });

  it('supports toast.update and error assertive priority', async () => {
    render(<Toaster />);

    let id = '';
    act(() => {
      id = toast.loading('Initial step…');
    });
    expect(screen.getByText('Initial step…')).toBeInTheDocument();

    act(() => {
      toast.update(id, { title: 'Updated title', type: 'error' });
    });
    expect(await screen.findByText('Updated title')).toBeInTheDocument();

    act(() => {
      toast.dismiss(id);
    });
  });
});
