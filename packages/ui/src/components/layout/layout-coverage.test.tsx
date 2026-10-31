import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  FormGrid,
  FormSection,
  FormActions,
  PageHeader,
  ScrollArea,
  SkipLink,
  Stepper,
  TopBar,
  TopBarStart,
  TopBarCenter,
  TopBarEnd,
} from '@innostes/ui';

describe('Layout: SkipLink, PageHeader, TopBar, FormLayout, ScrollArea', () => {
  it('renders SkipLink pointing to main-content by default', () => {
    render(
      <div>
        <SkipLink />
        <main id="main-content">Target Area</main>
      </div>,
    );
    const link = screen.getByRole('link', { name: 'Skip to main content' });
    expect(link).toHaveAttribute('href', '#main-content');
  });

  it('renders PageHeader with heading and actions', () => {
    render(
      <PageHeader
        title="Invoices Management"
        description="Track incoming and outgoing payments"
        actions={<button type="button">New Invoice</button>}
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'Invoices Management' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Track incoming and outgoing payments'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'New Invoice' }),
    ).toBeInTheDocument();
  });

  it('renders TopBar with start, center, and end sections', () => {
    render(
      <TopBar>
        <TopBarStart>
          <span>Northwind ERP</span>
        </TopBarStart>
        <TopBarCenter>
          <input aria-label="Search items" />
        </TopBarCenter>
        <TopBarEnd>
          <span>User Profile</span>
        </TopBarEnd>
      </TopBar>,
    );

    expect(screen.getByText('Northwind ERP')).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: 'Search items' }),
    ).toBeInTheDocument();
    expect(screen.getByText('User Profile')).toBeInTheDocument();
  });

  it('renders FormGrid, FormSection, and FormActions', () => {
    render(
      <FormSection
        title="Tax Configuration"
        description="Set region-specific tax numbers"
      >
        <FormGrid columns={2}>
          <div>Field A</div>
          <div>Field B</div>
        </FormGrid>
        <FormActions>
          <button type="submit">Save settings</button>
        </FormActions>
      </FormSection>,
    );

    expect(screen.getByText('Tax Configuration')).toBeInTheDocument();
    expect(
      screen.getByText('Set region-specific tax numbers'),
    ).toBeInTheDocument();
    expect(screen.getByText('Field A')).toBeInTheDocument();
    expect(screen.getByText('Field B')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Save settings' }),
    ).toBeInTheDocument();
  });

  it('renders ScrollArea content', () => {
    render(
      <ScrollArea className="h-32">
        <p>Scrollable long statement</p>
      </ScrollArea>,
    );
    expect(screen.getByText('Scrollable long statement')).toBeInTheDocument();
  });
});

describe('Navigation: Stepper custom status labels', () => {
  it('supports custom accessible labels for completed, error, and clickable steps', async () => {
    const handleStepClick = vi.fn();
    const steps = [
      { title: 'Billing Info', description: 'Address' },
      { title: 'Payment', description: 'Card' },
      { title: 'Confirmation', description: 'Review' },
    ];

    render(
      <Stepper
        steps={steps}
        currentStep={1}
        onStepClick={handleStepClick}
        labels={{
          completedGoBack: '(revenir en arrière)',
          completed: '(terminé)',
          hasErrors: '(erreur)',
        }}
      />,
    );

    expect(screen.getByText('(revenir en arrière)')).toBeInTheDocument();

    const completedButton = screen.getByRole('button', {
      name: /Billing Info/,
    });
    await userEvent.click(completedButton);
    expect(handleStepClick).toHaveBeenCalledWith(0);
  });
});
