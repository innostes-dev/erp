import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SplitPane } from '@innostes/ui';

describe('SplitPane', () => {
  it('renders both panes and an accessible separator', () => {
    render(
      <SplitPane defaultSize={30} minSize={20} maxSize={70}>
        <div>List</div>
        <div>Detail</div>
      </SplitPane>,
    );
    expect(screen.getByText('List')).toBeInTheDocument();
    expect(screen.getByText('Detail')).toBeInTheDocument();
    const handle = screen.getByRole('separator', { name: 'Resize panes' });
    expect(handle).toHaveAttribute('aria-valuenow', '30');
    expect(handle).toHaveAttribute('aria-valuemin', '20');
    expect(handle).toHaveAttribute('aria-valuemax', '70');
    expect(handle).toHaveAttribute('aria-orientation', 'vertical');
    expect(document.getElementById(handle.getAttribute('aria-controls')!)).toHaveTextContent('List');
  });

  it('resizes with the keyboard within the limits', async () => {
    const user = userEvent.setup();
    const onSizeChange = vi.fn();
    render(
      <SplitPane defaultSize={50} step={5} minSize={20} maxSize={80} onSizeChange={onSizeChange}>
        <div>A</div>
        <div>B</div>
      </SplitPane>,
    );
    const handle = screen.getByRole('separator');
    await user.tab();
    expect(handle).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(handle).toHaveAttribute('aria-valuenow', '55');
    await user.keyboard('{Shift>}{ArrowLeft}{/Shift}');
    expect(handle).toHaveAttribute('aria-valuenow', '35');
    await user.keyboard('{End}');
    expect(onSizeChange).toHaveBeenLastCalledWith(80);
    await user.keyboard('{ArrowRight}');
    expect(handle).toHaveAttribute('aria-valuenow', '80');
    await user.keyboard('{Home}');
    expect(handle).toHaveAttribute('aria-valuenow', '20');
  });

  it('uses Up and Down when stacked, and resets on double-click', async () => {
    const user = userEvent.setup();
    render(
      <SplitPane orientation="vertical" defaultSize={40} step={10}>
        <div>A</div>
        <div>B</div>
      </SplitPane>,
    );
    const handle = screen.getByRole('separator');
    expect(handle).toHaveAttribute('aria-orientation', 'horizontal');
    await user.tab();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(handle).toHaveAttribute('aria-valuenow', '60');
    await user.keyboard('{ArrowRight}');
    expect(handle).toHaveAttribute('aria-valuenow', '60');
    await user.dblClick(handle);
    expect(handle).toHaveAttribute('aria-valuenow', '40');
  });
});
