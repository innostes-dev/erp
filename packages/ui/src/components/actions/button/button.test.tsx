import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@innostes/ui';
import { buttonVariants } from '@innostes/ui';

describe('Button', () => {
  it('renders a button that does not submit forms by default', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute(
      'type',
      'button',
    );
  });

  it('keeps an explicit type', () => {
    render(<Button type="submit">Send</Button>);
    expect(screen.getByRole('button', { name: 'Send' })).toHaveAttribute(
      'type',
      'submit',
    );
  });

  it('calls onClick', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('blocks clicks and announces busy while loading, but stays focusable', async () => {
    const onClick = vi.fn();
    render(
      <Button loading loadingText="Saving…" onClick={onClick}>
        Save
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Saving…' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).not.toHaveAttribute('disabled');
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders as another element with render', () => {
    render(
      <Button render={<a href="/docs" />} nativeButton={false}>
        Docs
      </Button>,
    );
    const link = screen.getByRole('button', { name: 'Docs' });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/docs');
    expect(link).not.toHaveAttribute('type');
  });

  it('exposes variant as a data attribute and merges className', () => {
    render(
      <Button variant="destructive" className="rounded-full">
        Delete
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-variant', 'destructive');
    expect(button.className).toContain('rounded-full');
    expect(button.className).not.toMatch(/\brounded-md\b/);
  });

  it('renders icons around the label', () => {
    render(
      <Button
        startIcon={<svg data-testid="start" />}
        endIcon={<svg data-testid="end" />}
      >
        Next
      </Button>,
    );
    expect(screen.getByTestId('start')).toBeInTheDocument();
    expect(screen.getByTestId('end')).toBeInTheDocument();
  });
});

describe('buttonVariants', () => {
  it('produces classes for links styled as buttons', () => {
    expect(buttonVariants({ variant: 'outline', size: 'sm' })).toContain('h-8');
  });
});
