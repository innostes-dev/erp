# DatePicker

The `DatePicker` component provides a professional and intuitive interface for selecting dates. It features a dropdown calendar, manual text entry support, and advanced date constraints.

## Features

- **Integrated Input**: Combines a text input with a clickable calendar trigger.
- **Calendar View**: High-quality month/year navigation with highlighted selections.
- **Date Constraints**: Control selectable ranges using `minDate` and `maxDate`.
- **Dynamic Formatting**: Customizable display format (e.g., `MM/DD/YYYY`, `DD/MM/YYYY`).
- **Validation Integrated**: Built-in support for `error`, `success`, and `helperText` states.
- **Interactive Flags**: Optional `clearable` button and "Today" quick-select.
- **Accessible**: Keyboard support for opening/closing and ARIA-compliant labeling.

## Installation

```bash
import { DatePicker } from '@luxis-ui/react';
```

## Usage

### Basic Usage

```tsx
import { DatePicker } from '@luxis-ui/react';

const App = () => {
  const [date, setDate] = useState<Date | null>(new Date());

  return (
    <DatePicker
      label="Schedule Event"
      value={date}
      onChange={setDate}
      placeholder="Select date"
    />
  );
};
```

### With Min/Max Constraints

```tsx
<DatePicker
  label="Departure Date"
  minDate={new Date()} // Can't pick past dates
  maxDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)} // Up to 1 year ahead
  onChange={(val) => console.log(val)}
/>
```

### Formatting

```tsx
<DatePicker 
  format="DD/MM/YYYY" 
  placeholder="DD/MM/YYYY"
  clearable
/>
```

## API Reference

### DatePicker Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `value` | `Date \| null` | - | Currently selected date object. |
| `onChange` | `(date) => void` | - | Fired when a new date is selected/entered. |
| `label` | `string` | - | Display label for the field. |
| `placeholder` | `string` | `'Select date'` | Input placeholder. |
| `format` | `string` | `'MM/DD/YYYY'` | Display and parsing format. |
| `minDate` | `Date` | - | Earliest allowed date. |
| `maxDate` | `Date` | - | Latest allowed date. |
| `disabledDates`| `Date[]` | - | Specific dates to disable. |
| `clearable` | `boolean` | `false` | Shows a clear button on the right. |
| `showToday` | `boolean` | `true` | Shows "Today" link in the calendar footer. |
| `error` | `string` | - | Error message/state. |
| `success` | `string` | - | Success message/state. |
| `fullWidth` | `boolean` | `false` | Spans 100% of container. |
| `disabled` | `boolean` | `false` | Prevents user interaction. |

## CSS Classes

| Selector | Description |
| :--- | :--- |
| `.lxs-datepicker` | Main component wrapper. |
| `.lxs-datepicker__input` | The text input container. |
| `.lxs-datepicker__dropdown` | The popup calendar container. |
| `.lxs-datepicker__footer` | Bottom area (Today button). |
| `.lxs-datepicker__today-button`| Quick-select link for current date. |
| `.lxs-calendar` | The internal calendar grid styles. |
