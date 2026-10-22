import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  CountrySelect,
  CurrencySelect,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  LanguageSelect,
  PasswordInput,
  SearchableSelect,
  SearchInput,
  TimezoneSelect,
} from '@innostes/ui';

describe('InputGroup', () => {
  it('renders add-ons around the input', () => {
    render(
      <InputGroup>
        <InputGroupAddon>https://</InputGroupAddon>
        <InputGroupInput aria-label="Domain" />
      </InputGroup>,
    );
    expect(screen.getByRole('group')).toHaveTextContent('https://');
    expect(screen.getByRole('textbox', { name: 'Domain' })).toBeInTheDocument();
  });
});

describe('SearchInput', () => {
  it('clears with the button and with Escape', async () => {
    const onValueChange = vi.fn();
    render(<SearchInput aria-label="Search" onValueChange={onValueChange} />);
    const input = screen.getByRole('searchbox', { name: 'Search' });
    await userEvent.type(input, 'acme');
    expect(onValueChange).toHaveBeenLastCalledWith('acme');
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
    await userEvent.type(input, 'x{Escape}');
    expect(input).toHaveValue('');
  });
});

describe('PasswordInput', () => {
  it('toggles visibility', async () => {
    render(<PasswordInput aria-label="Password" />);
    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');
    const toggle = screen.getByRole('button', { name: 'Show password' });
    await userEvent.click(toggle);
    expect(input).toHaveAttribute('type', 'text');
    expect(
      screen.getByRole('button', { name: 'Hide password' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('SearchableSelect', () => {
  const options = [
    { value: 'blr', label: 'Bengaluru', keywords: ['Bangalore'] },
    { value: 'hyd', label: 'Hyderabad' },
    { value: 'mum', label: 'Mumbai' },
  ];

  it('filters by label and keywords, and selects', async () => {
    const onValueChange = vi.fn();
    render(
      <SearchableSelect
        aria-label="City"
        options={options}
        onValueChange={onValueChange}
      />,
    );
    const input = screen.getByRole('combobox', { name: 'City' });
    await userEvent.type(input, 'bangal');
    const option = await screen.findByRole('option', { name: 'Bengaluru' });
    expect(screen.queryByRole('option', { name: 'Mumbai' })).toBeNull();
    await userEvent.click(option);
    expect(onValueChange).toHaveBeenCalledWith('blr');
    expect(input).toHaveValue('Bengaluru');
  });

  it('shows the selected label for a controlled value', () => {
    render(
      <SearchableSelect aria-label="City" options={options} value="hyd" />,
    );
    expect(screen.getByRole('combobox')).toHaveValue('Hyderabad');
  });
});

describe('locale selects', () => {
  it('names countries in the requested language', () => {
    const { rerender } = render(
      <CountrySelect aria-label="Country" locale="en" value="DE" />,
    );
    expect(screen.getByRole('combobox')).toHaveValue('Germany');
    rerender(<CountrySelect aria-label="Country" locale="de" value="DE" />);
    expect(screen.getByRole('combobox')).toHaveValue('Deutschland');
  });

  it('labels time zones with their UTC offset', () => {
    render(<TimezoneSelect aria-label="Time zone" value="Asia/Kolkata" />);
    expect(screen.getByRole('combobox')).toHaveValue(
      '(GMT+05:30) Asia/Kolkata',
    );
  });

  it('names languages and currencies', () => {
    render(
      <>
        <LanguageSelect aria-label="Language" locale="en" value="en-IN" />
        <CurrencySelect aria-label="Currency" locale="en" value="INR" />
      </>,
    );
    expect(screen.getByRole('combobox', { name: 'Language' })).toHaveValue(
      'English (India)',
    );
    expect(screen.getByRole('combobox', { name: 'Currency' })).toHaveValue(
      'Indian Rupee (INR)',
    );
  });
});
