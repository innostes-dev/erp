/**
 * `classNames` prop for components with several inner parts: one class string per part,
 * merged with the part's defaults (yours win). Every part also has a matching `data-slot`
 * attribute for plain CSS.
 *
 * @example
 * <MetricCard classNames={{ value: 'text-primary', label: 'uppercase tracking-wide' }} … />
 */
export type SlotClassNames<Slot extends string> = Partial<Record<Slot, string>>;
