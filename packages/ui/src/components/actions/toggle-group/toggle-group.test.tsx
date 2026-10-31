import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toggle } from '@innostes/ui';
import { ToggleGroup, ToggleGroupItem } from '@innostes/ui';
import { ButtonGroup } from '@innostes/ui';

describe('Toggle', () => {
    it('toggles aria-pressed', async () => {
        render(<Toggle aria-label="Bold">B</Toggle>);
        const toggle = screen.getByRole('button', { name: 'Bold' });
        expect(toggle).toHaveAttribute('aria-pressed', 'false');
        await userEvent.click(toggle);
        expect(toggle).toHaveAttribute('aria-pressed', 'true');
    });
});

describe('ToggleGroup', () => {
    it('allows one pressed item by default', async () => {
        const onValueChange = vi.fn();
        render(
            <ToggleGroup
                defaultValue={['list']}
                onValueChange={onValueChange}
                aria-label="View"
            >
                <ToggleGroupItem value="list">List</ToggleGroupItem>
                <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
            </ToggleGroup>,
        );
        await userEvent.click(screen.getByRole('button', { name: 'Grid' }));
        expect(onValueChange).toHaveBeenLastCalledWith(['grid'], expect.anything());
        expect(screen.getByRole('button', { name: 'List' })).toHaveAttribute(
            'aria-pressed',
            'false',
        );
    });
});

describe('ButtonGroup', () => {
    it('renders a labelled group', () => {
        render(
            <ButtonGroup aria-label="Alignment">
                <button>Left</button>
            </ButtonGroup>,
        );
        expect(screen.getByRole('group', { name: 'Alignment' })).toHaveAttribute(
            'data-orientation',
            'horizontal',
        );
    });
});
