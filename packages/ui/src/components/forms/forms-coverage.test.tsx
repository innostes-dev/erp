import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxSeparator,
  Select,
  SelectContent,
  SelectGroup,
  SelectGroupLabel,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  Fieldset,
  FieldsetLegend,
  Checkbox,
  CheckboxGroup,
  CountrySelect,
  CurrencySelect,
  DateFormatSelect,
  LanguageSelect,
  TimezoneSelect,
  FileDropzone,
  defaultDateRangePresets,
  NumberField,
} from '@innostes/ui';

describe('Combobox full anatomy', () => {
  it('renders input, group, items, separator, and empty text', () => {
    const items = ['Apple', 'Banana'];
    render(
      <Combobox items={items} defaultValue="Apple">
        <ComboboxInput
          placeholder="Pick a fruit"
          clearLabel="Remove fruit"
          openLabel="Expand fruit"
          aria-label="Fruit input"
        />
        <ComboboxContent>
          <ComboboxGroup>
            <ComboboxGroupLabel>Fresh Fruits</ComboboxGroupLabel>
            <ComboboxList>
              {(item: string) => (
                <ComboboxItem key={item} value={item}>
                  {item}
                </ComboboxItem>
              )}
            </ComboboxList>
            <ComboboxSeparator />
          </ComboboxGroup>
          <ComboboxEmpty>No fruit found</ComboboxEmpty>
        </ComboboxContent>
      </Combobox>,
    );

    const input = screen.getByLabelText('Fruit input');
    expect(input).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Remove fruit' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Expand fruit' }),
    ).toBeInTheDocument();
  });
});

describe('Select full anatomy', () => {
  it('renders trigger, value, group, items, and separator', () => {
    const items = [
      { value: 'draft', label: 'Draft' },
      { value: 'published', label: 'Published' },
    ];

    render(
      <Select items={items} defaultValue="draft">
        <SelectTrigger aria-label="Status select">
          <SelectValue placeholder="Choose status" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectGroupLabel>States</SelectGroupLabel>
            {items.map((i) => (
              <SelectItem key={i.value} value={i.value}>
                {i.label}
              </SelectItem>
            ))}
            <SelectSeparator />
          </SelectGroup>
        </SelectContent>
      </Select>,
    );

    const trigger = screen.getByRole('combobox', { name: 'Status select' });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent('Draft');
  });
});

describe('Fieldset and CheckboxGroup', () => {
  it('renders fieldset with legend', () => {
    render(
      <Fieldset disabled>
        <FieldsetLegend>Permissions</FieldsetLegend>
        <input type="text" aria-label="Test field" />
      </Fieldset>,
    );
    expect(screen.getByText('Permissions')).toBeInTheDocument();
    expect(screen.getByLabelText('Test field')).toBeDisabled();
  });

  it('handles CheckboxGroup with multiple values', async () => {
    const onValueChange = vi.fn();
    render(
      <CheckboxGroup
        defaultValue={['opt1']}
        onValueChange={onValueChange}
        aria-label="Options"
      >
        <label>
          <Checkbox value="opt1" /> Option 1
        </label>
        <label>
          <Checkbox value="opt2" /> Option 2
        </label>
      </CheckboxGroup>,
    );

    const check1 = screen.getByRole('checkbox', { name: 'Option 1' });
    const check2 = screen.getByRole('checkbox', { name: 'Option 2' });
    expect(check1).toBeChecked();
    expect(check2).not.toBeChecked();

    await userEvent.click(check2);
    expect(onValueChange).toHaveBeenCalledWith(
      ['opt1', 'opt2'],
      expect.anything(),
    );
  });
});

describe('NumberField configurable labels', () => {
  it('respects decrementLabel and incrementLabel', () => {
    render(
      <NumberField
        defaultValue={10}
        aria-label="Quantity"
        decrementLabel="Minus one"
        incrementLabel="Plus one"
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Minus one' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Plus one' }),
    ).toBeInTheDocument();
  });
});

describe('FileDropzone Field integration', () => {
  it('reflects invalid state visually and via ARIA attributes', () => {
    render(
      <FileDropzone
        aria-label="Upload invoice"
        invalid
        aria-describedby="invoice-error"
      />,
    );
    const dropzone = screen.getByRole('button', { name: 'Browse files' });
    expect(dropzone).toHaveAttribute('aria-invalid', 'true');
    expect(dropzone).toHaveAttribute('aria-describedby', 'invoice-error');
  });
});

describe('LocaleSelect data-slot attributes and presets', () => {
  it('renders locale select components with appropriate data-slots', () => {
    render(
      <div>
        <CountrySelect aria-label="Country" defaultValue="IN" />
        <TimezoneSelect aria-label="Timezone" defaultValue="Asia/Kolkata" />
        <LanguageSelect aria-label="Language" defaultValue="en-IN" />
        <CurrencySelect aria-label="Currency" defaultValue="INR" />
        <DateFormatSelect aria-label="Date format" defaultValue="DD/MM/YYYY" />
      </div>,
    );

    expect(screen.getByLabelText('Country')).toBeInTheDocument();
    expect(screen.getByLabelText('Timezone')).toBeInTheDocument();
    expect(screen.getByLabelText('Language')).toBeInTheDocument();
    expect(screen.getByLabelText('Currency')).toBeInTheDocument();
    expect(screen.getByLabelText('Date format')).toBeInTheDocument();
  });

  it('executes all defaultDateRangePresets without error', () => {
    expect(defaultDateRangePresets.length).toBeGreaterThan(0);
    for (const preset of defaultDateRangePresets) {
      expect(typeof preset.label).toBe('string');
      const range = preset.range();
      expect(range.from).toBeInstanceOf(Date);
      expect(range.to).toBeInstanceOf(Date);
    }
  });

  it('renders Combobox and Select grouping and separator subcomponents', () => {
    render(
      <div>
        <Combobox open>
          <ComboboxInput aria-label="Grouped Combobox" />
          <ComboboxContent>
            <ComboboxEmpty>No results</ComboboxEmpty>
            <ComboboxGroup>
              <ComboboxGroupLabel>Group 1</ComboboxGroupLabel>
              <ComboboxItem value="a">Item A</ComboboxItem>
            </ComboboxGroup>
            <ComboboxSeparator />
            <ComboboxGroup>
              <ComboboxGroupLabel>Group 2</ComboboxGroupLabel>
              <ComboboxItem value="b">Item B</ComboboxItem>
            </ComboboxGroup>
          </ComboboxContent>
        </Combobox>

        <Select open defaultValue="1">
          <SelectTrigger aria-label="Grouped Select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectGroupLabel>Select Group</SelectGroupLabel>
              <SelectItem value="1">One</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectItem value="2">Two</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>,
    );

    expect(screen.getByText('Group 1')).toBeInTheDocument();
    expect(screen.getByText('Group 2')).toBeInTheDocument();
    expect(screen.getByText('Select Group')).toBeInTheDocument();
  });
});
