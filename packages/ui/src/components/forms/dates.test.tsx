import { describe, expect, it, vi } from 'vitest';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Calendar, DatePicker, DateRangePicker } from '@innostes/ui';

const oct = (day: number) => new Date(2026, 9, day);
const dayButton = (name: RegExp | string) =>
  screen.getByRole('button', { name });

describe('Calendar', () => {
  it('renders a labelled month grid with weekday headers', () => {
    render(<Calendar locale="en-US" defaultMonth={oct(1)} />);
    const grid = screen.getByRole('grid', { name: 'October 2026' });
    expect(within(grid).getAllByRole('columnheader')).toHaveLength(7);
    expect(within(grid).getAllByRole('columnheader')[0]).toHaveTextContent(
      'Sun',
    );
  });

  it('starts the week on Monday for en-GB', () => {
    render(<Calendar locale="en-GB" defaultMonth={oct(1)} />);
    expect(screen.getAllByRole('columnheader')[0]).toHaveTextContent('Mon');
  });

  it('selects a day on click', async () => {
    const onValueChange = vi.fn();
    render(
      <Calendar
        locale="en-US"
        defaultMonth={oct(1)}
        onValueChange={onValueChange}
      />,
    );
    await userEvent.click(dayButton('Thursday, October 15, 2026'));
    expect(onValueChange).toHaveBeenCalledWith(oct(15));
    expect(dayButton('Thursday, October 15, 2026')).toHaveAttribute(
      'data-selected',
      'true',
    );
  });

  it('moves focus with the keyboard and changes month at the edges', async () => {
    render(<Calendar locale="en-US" defaultValue={oct(31)} />);
    const start = dayButton('Saturday, October 31, 2026');
    start.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(dayButton('Sunday, November 1, 2026')).toHaveFocus();
    expect(
      screen.getByRole('grid', { name: 'November 2026' }),
    ).toBeInTheDocument();
    await userEvent.keyboard('{PageUp}');
    expect(dayButton('Thursday, October 1, 2026')).toHaveFocus();
  });

  it('does not select days outside min/max', async () => {
    const onValueChange = vi.fn();
    render(
      <Calendar
        locale="en-US"
        defaultMonth={oct(1)}
        min={oct(10)}
        onValueChange={onValueChange}
      />,
    );
    const disabled = dayButton('Monday, October 5, 2026');
    expect(disabled).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(disabled);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Previous month' }),
    ).toBeDisabled();
  });

  it('picks a range in two clicks, in either order', async () => {
    const onValueChange = vi.fn();
    render(
      <Calendar
        mode="range"
        locale="en-US"
        defaultMonth={oct(1)}
        onValueChange={onValueChange}
      />,
    );
    await userEvent.click(dayButton('Tuesday, October 20, 2026'));
    expect(onValueChange).toHaveBeenLastCalledWith({ from: oct(20), to: null });
    await userEvent.click(dayButton('Saturday, October 10, 2026'));
    expect(onValueChange).toHaveBeenLastCalledWith({
      from: oct(10),
      to: oct(20),
    });
  });
});

describe('DatePicker', () => {
  it('opens a calendar, picks a date and submits it as YYYY-MM-DD', async () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <DatePicker
        aria-label="Due date"
        locale="en-US"
        name="due"
        defaultValue={oct(1)}
        onValueChange={onValueChange}
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Due date' });
    expect(trigger).toHaveTextContent('Oct 1, 2026');
    await userEvent.click(trigger);
    await userEvent.click(
      await screen.findByRole('button', { name: 'Friday, October 23, 2026' }),
    );
    expect(onValueChange).toHaveBeenCalledWith(oct(23));
    await waitFor(() =>
      expect(screen.queryByRole('grid')).not.toBeInTheDocument(),
    );
    expect(container.querySelector('input[name="due"]')).toHaveValue(
      '2026-10-23',
    );
  });

  it('clears the value', async () => {
    const onValueChange = vi.fn();
    render(
      <DatePicker
        aria-label="Due date"
        defaultValue={oct(1)}
        onValueChange={onValueChange}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Clear date' }));
    expect(onValueChange).toHaveBeenCalledWith(null);
    expect(screen.getByRole('button', { name: 'Due date' })).toHaveTextContent(
      'Pick a date',
    );
  });
});

describe('DateRangePicker', () => {
  it('applies a preset', async () => {
    const onValueChange = vi.fn();
    render(
      <DateRangePicker
        aria-label="Period"
        presets={[
          { label: 'October', range: () => ({ from: oct(1), to: oct(31) }) },
        ]}
        onValueChange={onValueChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Period' }));
    await userEvent.click(
      await screen.findByRole('button', { name: 'October' }),
    );
    expect(onValueChange).toHaveBeenCalledWith({ from: oct(1), to: oct(31) });
  });
});
