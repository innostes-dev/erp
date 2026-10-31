import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Checkbox } from '@innostes/ui';
import { Field, FieldDescription, FieldError, FieldLabel } from '@innostes/ui';
import { Form } from '@innostes/ui';
import { Input } from '@innostes/ui';
import { Label } from '@innostes/ui';
import { NumberField } from '@innostes/ui';
import { Radio, RadioGroup } from '@innostes/ui';
import { Slider } from '@innostes/ui';
import { Switch } from '@innostes/ui';
import { Textarea } from '@innostes/ui';

describe('Field', () => {
    it('links label and description to the control', () => {
        render(
            <Field>
                <FieldLabel>Email</FieldLabel>
                <Input type="email" />
                <FieldDescription>We never share it.</FieldDescription>
            </Field>,
        );
        const input = screen.getByLabelText('Email');
        expect(input).toHaveAttribute('type', 'email');
        expect(input).toHaveAccessibleDescription('We never share it.');
    });

    it('shows a validation error on submit and marks the control invalid', async () => {
        const onFormSubmit = vi.fn();
        render(
            <Form onFormSubmit={onFormSubmit}>
                <Field name="name">
                    <FieldLabel>Name</FieldLabel>
                    <Input required />
                    <FieldError match="valueMissing">Name is required</FieldError>
                </Field>
                <button type="submit">Save</button>
            </Form>,
        );
        await userEvent.click(screen.getByRole('button', { name: 'Save' }));
        expect(await screen.findByText('Name is required')).toBeInTheDocument();
        expect(screen.getByLabelText('Name')).toHaveAttribute(
            'aria-invalid',
            'true',
        );
        expect(onFormSubmit).not.toHaveBeenCalled();
    });

    it('submits values as an object when valid', async () => {
        const onFormSubmit = vi.fn();
        render(
            <Form onFormSubmit={onFormSubmit}>
                <Field name="name">
                    <FieldLabel>Name</FieldLabel>
                    <Input required />
                </Field>
                <button type="submit">Save</button>
            </Form>,
        );
        await userEvent.type(screen.getByLabelText('Name'), 'Ada');
        await userEvent.click(screen.getByRole('button', { name: 'Save' }));
        await waitFor(() => expect(onFormSubmit).toHaveBeenCalled());
        expect(onFormSubmit.mock.calls[0]?.[0]).toMatchObject({ name: 'Ada' });
    });
});

describe('Label', () => {
    it('shows a visual required marker hidden from screen readers', () => {
        render(
            <>
                <Label htmlFor="x" required>
                    Company
                </Label>
                <input id="x" />
            </>,
        );
        expect(screen.getByLabelText(/Company/)).toBeInTheDocument();
        expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true');
    });
});

describe('Textarea', () => {
    it('renders a textarea with rows', () => {
        render(<Textarea aria-label="Notes" rows={5} />);
        const textarea = screen.getByRole('textbox', { name: 'Notes' });
        expect(textarea.tagName).toBe('TEXTAREA');
        expect(textarea).toHaveAttribute('rows', '5');
    });
});

describe('Checkbox', () => {
    it('toggles checked state', async () => {
        const onCheckedChange = vi.fn();
        render(<Checkbox aria-label="Accept" onCheckedChange={onCheckedChange} />);
        const checkbox = screen.getByRole('checkbox', { name: 'Accept' });
        expect(checkbox).toHaveAttribute('aria-checked', 'false');
        await userEvent.click(checkbox);
        expect(checkbox).toHaveAttribute('aria-checked', 'true');
        expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything());
    });

    it('supports the indeterminate state', () => {
        render(<Checkbox aria-label="Select all" indeterminate />);
        expect(screen.getByRole('checkbox')).toHaveAttribute(
            'aria-checked',
            'mixed',
        );
    });
});

describe('Switch', () => {
    it('toggles on click', async () => {
        render(<Switch aria-label="Notifications" />);
        const toggle = screen.getByRole('switch', { name: 'Notifications' });
        expect(toggle).toHaveAttribute('aria-checked', 'false');
        await userEvent.click(toggle);
        expect(toggle).toHaveAttribute('aria-checked', 'true');
    });
});

describe('RadioGroup', () => {
    it('selects exactly one option', async () => {
        render(
            <RadioGroup defaultValue="monthly" aria-label="Billing">
                <Radio value="monthly" aria-label="Monthly" />
                <Radio value="yearly" aria-label="Yearly" />
            </RadioGroup>,
        );
        expect(screen.getByRole('radio', { name: 'Monthly' })).toHaveAttribute(
            'aria-checked',
            'true',
        );
        await userEvent.click(screen.getByRole('radio', { name: 'Yearly' }));
        expect(screen.getByRole('radio', { name: 'Yearly' })).toHaveAttribute(
            'aria-checked',
            'true',
        );
        expect(screen.getByRole('radio', { name: 'Monthly' })).toHaveAttribute(
            'aria-checked',
            'false',
        );
    });
});

describe('NumberField', () => {
    it('increments and respects max', async () => {
        render(<NumberField defaultValue={1} max={2} aria-label="Quantity" />);
        const input = screen.getByRole('textbox', { name: 'Quantity' });
        await userEvent.click(screen.getByRole('button', { name: 'Increase' }));
        expect(input).toHaveValue('2');
        await userEvent.click(screen.getByRole('button', { name: 'Increase' }));
        expect(input).toHaveValue('2');
    });
});

describe('Slider', () => {
    it('renders one thumb per value with labels', () => {
        render(
            <Slider defaultValue={[20, 80]} thumbLabels={['Minimum', 'Maximum']} />,
        );
        const thumbs = screen.getAllByRole('slider');
        expect(thumbs).toHaveLength(2);
        expect(thumbs[0]).toHaveAccessibleName('Minimum');
        expect(thumbs[1]).toHaveAttribute('aria-valuenow', '80');
    });
});
