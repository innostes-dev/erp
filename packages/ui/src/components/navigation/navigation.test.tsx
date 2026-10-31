import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from '@innostes/ui';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@innostes/ui';
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from '@innostes/ui';
import { Pagination } from '@innostes/ui';
import { Tabs, TabsList, TabsPanel, TabsTab } from '@innostes/ui';

describe('Tabs', () => {
  it('switches panels', async () => {
    render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTab value="a">Overview</TabsTab>
          <TabsTab value="b">Activity</TabsTab>
        </TabsList>
        <TabsPanel value="a">Overview panel</TabsPanel>
        <TabsPanel value="b">Activity panel</TabsPanel>
      </Tabs>,
    );
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(
      screen.getByRole('tabpanel', { name: 'Overview' }),
    ).toHaveTextContent('Overview panel');

    await userEvent.click(screen.getByRole('tab', { name: 'Activity' }));
    expect(screen.getByRole('tab', { name: 'Activity' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    // Base UI may keep the previous panel mounted briefly while it animates out.
    expect(
      await screen.findByRole('tabpanel', { name: 'Activity' }),
    ).toHaveTextContent('Activity panel');
  });
});

describe('Accordion', () => {
  it('expands a section', async () => {
    render(
      <Accordion>
        <AccordionItem value="billing">
          <AccordionTrigger>Billing</AccordionTrigger>
          <AccordionPanel>Billing details</AccordionPanel>
        </AccordionItem>
      </Accordion>,
    );
    const trigger = screen.getByRole('button', { name: 'Billing' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Billing details')).toBeVisible();
  });
});

describe('Collapsible', () => {
  it('toggles its panel', async () => {
    render(
      <Collapsible>
        <CollapsibleTrigger>Advanced</CollapsibleTrigger>
        <CollapsiblePanel>Advanced options</CollapsiblePanel>
      </Collapsible>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Advanced' }));
    expect(screen.getByRole('button', { name: 'Advanced' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByText('Advanced options')).toBeInTheDocument();
  });
});

describe('Breadcrumb', () => {
  it('is a labelled nav with the current page marked', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/orders">Orders</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>#1024</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );
    expect(
      screen.getByRole('navigation', { name: 'Breadcrumb' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Orders' })).toHaveAttribute(
      'href',
      '/orders',
    );
    expect(screen.getByText('#1024')).toHaveAttribute('aria-current', 'page');
  });

  it('renders a custom link element', () => {
    render(
      <BreadcrumbLink render={<a data-router="yes" href="/x" />}>
        Home
      </BreadcrumbLink>,
    );
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
      'data-router',
      'yes',
    );
  });
});

describe('Pagination', () => {
  it('marks the current page and reports changes', async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={2} pageCount={5} onPageChange={onPageChange} />);
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
    await userEvent.click(screen.getByRole('button', { name: 'Page 5' }));
    expect(onPageChange).toHaveBeenCalledWith(5);
  });

  it('disables Previous on the first page', () => {
    render(<Pagination page={1} pageCount={5} onPageChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
  });

  it('accepts translated labels', () => {
    render(
      <Pagination
        page={1}
        pageCount={3}
        onPageChange={() => {}}
        labels={{
          next: 'Weiter',
          previous: 'Zurück',
          page: (n) => `Seite ${n}`,
        }}
      />,
    );
    expect(screen.getByRole('button', { name: 'Weiter' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Seite 3' })).toBeInTheDocument();
  });
});
