'use client';

import { forwardRef, useMemo, type ReactNode } from 'react';
import { Combobox as BaseCombobox } from '@base-ui/react/combobox';
import { cn } from '../../../lib/cn';
import { CheckIcon, ChevronsUpDownIcon } from '../../../lib/icons';
import { listItem, popupSurface } from '../../../lib/styles';
import { useControllableState } from '../../../lib/use-controllable-state';
import { inputVariants, type InputSize } from '../input/input-variants';

/** One option of a `SearchableSelect`. */
export interface SearchableSelectOption {
  /** Value submitted with forms and passed to `onValueChange`. */
  value: string;
  /** Text shown and searched. */
  label: string;
  /** Extra words that should match the search, e.g. a country's code or a currency symbol. */
  keywords?: string[];
  /** Element before the label, e.g. a flag or an avatar. */
  leading?: ReactNode;
  /** Secondary text at the end of the option, e.g. "GMT+05:30". */
  trailing?: ReactNode;
}

export interface SearchableSelectProps {
  /** The options. Memoise the array if it's built on every render. */
  options: readonly SearchableSelectOption[];
  /** Selected value (controlled). `null` = nothing selected. */
  value?: string | null;
  /** Initially selected value (uncontrolled). */
  defaultValue?: string | null;
  /** Called with the new value (`null` when cleared). */
  onValueChange?: (value: string | null) => void;
  /** Text shown in the empty input. */
  placeholder?: string;
  /** Shown when the search matches nothing. @default 'No results.' */
  emptyText?: ReactNode;
  /** Form field name. Submits the option's `value`. */
  name?: string;
  /** Height and text size, matching `Input`. @default 'md' */
  size?: InputSize;
  /** Disable the field. */
  disabled?: boolean;
  /** Mark it as required. */
  required?: boolean;
  /** Show the invalid state. */
  invalid?: boolean;
  /** Id of the input, for `<Label htmlFor>`. */
  id?: string;
  /** Accessible name when there's no visible label. */
  'aria-label'?: string;
  /** Show the selected option's `leading` element inside the input. @default true */
  showLeadingInInput?: boolean;
  /** Extra classes for the input wrapper. */
  className?: string;
}

/**
 * A select you can type into to filter, for long lists of simple options (countries,
 * time zones, customers). Matches the label and `keywords`, case- and accent-insensitive.
 *
 * @example
 * <SearchableSelect
 *   aria-label="Warehouse"
 *   options={warehouses.map((w) => ({ value: w.id, label: w.name, trailing: w.city }))}
 *   value={warehouseId}
 *   onValueChange={setWarehouseId}
 * />
 */
export const SearchableSelect = forwardRef<
  HTMLInputElement,
  SearchableSelectProps
>(function SearchableSelect(
  {
    options,
    value: valueProp,
    defaultValue = null,
    onValueChange,
    placeholder = 'Select…',
    emptyText = 'No results.',
    name,
    size,
    disabled,
    required,
    invalid,
    id,
    'aria-label': ariaLabel,
    showLeadingInInput = true,
    className,
  },
  ref,
) {
  const [value, setValue] = useControllableState<string | null>({
    value: valueProp,
    defaultValue,
    onChange: onValueChange,
  });
  const selected = useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value],
  );
  const leading = showLeadingInInput ? selected?.leading : null;

  return (
    <BaseCombobox.Root<SearchableSelectOption>
      items={options as SearchableSelectOption[]}
      value={selected}
      onValueChange={(option) => setValue(option?.value ?? null)}
      itemToStringLabel={(option) => option.label}
      itemToStringValue={(option) => option.value}
      isItemEqualToValue={(a, b) => a.value === b.value}
      filter={(option, query) => {
        const q = normalize(query);
        return (
          !q ||
          [option.label, option.value, ...(option.keywords ?? [])].some(
            (text) => normalize(text).includes(q),
          )
        );
      }}
      name={name}
      disabled={disabled}
      required={required}
    >
      <BaseCombobox.InputGroup
        data-slot="searchable-select"
        className={cn(
          inputVariants({ size }),
          'relative flex items-center gap-2 p-0',
          'focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/25',
          invalid && 'border-destructive',
          className,
        )}
      >
        {leading && <span className="flex shrink-0 ps-3">{leading}</span>}
        <BaseCombobox.Input
          ref={ref}
          id={id}
          aria-label={ariaLabel}
          aria-invalid={invalid || undefined}
          placeholder={placeholder}
          className={cn(
            'h-full w-full min-w-0 bg-transparent pe-9 outline-none placeholder:text-muted-foreground',
            leading ? 'ps-0' : 'ps-3',
          )}
        />
        <BaseCombobox.Trigger
          aria-label="Show options"
          className="absolute end-1 flex size-7 cursor-pointer items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          <ChevronsUpDownIcon className="size-4" />
        </BaseCombobox.Trigger>
      </BaseCombobox.InputGroup>
      <BaseCombobox.Portal>
        <BaseCombobox.Positioner
          className="z-50 outline-none"
          sideOffset={4}
          align="start"
        >
          <BaseCombobox.Popup
            className={cn(
              popupSurface,
              'max-h-[min(var(--available-height),20rem)] w-(--anchor-width) overflow-y-auto p-1',
            )}
          >
            <BaseCombobox.Empty className="px-2 py-6 text-center text-sm text-muted-foreground empty:hidden">
              {emptyText}
            </BaseCombobox.Empty>
            <BaseCombobox.List>
              {(option: SearchableSelectOption) => (
                <BaseCombobox.Item
                  key={option.value}
                  value={option}
                  className={cn(listItem, 'cursor-pointer pe-8')}
                >
                  {option.leading && (
                    <span className="flex shrink-0">{option.leading}</span>
                  )}
                  <span className="truncate">{option.label}</span>
                  {option.trailing && (
                    <span className="ms-auto shrink-0 ps-3 text-xs text-muted-foreground tabular-nums">
                      {option.trailing}
                    </span>
                  )}
                  <BaseCombobox.ItemIndicator className="absolute end-2 flex items-center">
                    <CheckIcon className="size-4" />
                  </BaseCombobox.ItemIndicator>
                </BaseCombobox.Item>
              )}
            </BaseCombobox.List>
          </BaseCombobox.Popup>
        </BaseCombobox.Positioner>
      </BaseCombobox.Portal>
    </BaseCombobox.Root>
  );
});

function normalize(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}
