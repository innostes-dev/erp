import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@innostes/ui';

export interface FilterOption {
  value: string;
  label: string;
}

/** Compact labelled select for filter bars (the shared FilterBar piece). */
export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
}) {
  return (
    <Select items={options} value={value} onValueChange={(next) => onChange(next ?? options[0]?.value ?? '')}>
      <SelectTrigger aria-label={label} size="sm" className="w-full lg:w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
