import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PageHeader } from '@innostes/ui';
import { Separator } from '@innostes/ui';
import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@innostes/ui';

describe('Sidebar', () => {
  function Shell() {
    return (
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive render={<a href="/" />}>
                  Dashboard
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <SidebarTrigger />
        </SidebarInset>
      </SidebarProvider>
    );
  }

  it('renders a labelled navigation with the active link marked', () => {
    render(<Shell />);
    expect(
      screen.getByRole('navigation', { name: 'Main navigation' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('collapses and expands from the trigger', async () => {
    const { container } = render(<Shell />);
    const aside = container.querySelector('[data-slot=sidebar]');
    const trigger = screen.getByRole('button', { name: 'Toggle sidebar' });
    expect(aside).toHaveAttribute('data-state', 'expanded');
    await userEvent.click(trigger);
    expect(aside).toHaveAttribute('data-state', 'collapsed');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('toggles with the keyboard shortcut', async () => {
    const { container } = render(<Shell />);
    await userEvent.keyboard('{Control>}b{/Control}');
    expect(container.querySelector('[data-slot=sidebar]')).toHaveAttribute(
      'data-state',
      'collapsed',
    );
  });
});

describe('PageHeader', () => {
  it('renders the page heading and actions', () => {
    render(
      <PageHeader
        title="Orders"
        description="All orders"
        actions={<button>New order</button>}
      />,
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Orders' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'New order' }),
    ).toBeInTheDocument();
  });
});

describe('Separator', () => {
  it('is announced as a separator with its orientation', () => {
    render(<Separator orientation="vertical" />);
    expect(screen.getByRole('separator')).toHaveAttribute(
      'aria-orientation',
      'vertical',
    );
  });
});
