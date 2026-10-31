import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
    AlertDialog,
    AlertDialogClose,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@innostes/ui';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from '@innostes/ui';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@innostes/ui';
import {
    Popover,
    PopoverContent,
    PopoverTitle,
    PopoverTrigger,
} from '@innostes/ui';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@innostes/ui';

describe('Dialog', () => {
    it('opens from the trigger, is labelled by its title, and closes on Escape', async () => {
        render(
            <Dialog>
                <DialogTrigger>Edit</DialogTrigger>
                <DialogContent>
                    <DialogTitle>Edit profile</DialogTitle>
                    <DialogDescription>Update your details.</DialogDescription>
                </DialogContent>
            </Dialog>,
        );
        await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
        const dialog = await screen.findByRole('dialog', { name: 'Edit profile' });
        expect(dialog).toHaveAccessibleDescription('Update your details.');

        await userEvent.keyboard('{Escape}');
        await waitFor(() =>
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
        );
    });

    it('has an accessible close button', async () => {
        render(
            <Dialog defaultOpen>
                <DialogContent>
                    <DialogTitle>Title</DialogTitle>
                </DialogContent>
            </Dialog>,
        );
        await userEvent.click(await screen.findByRole('button', { name: 'Close' }));
        await waitFor(() =>
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
        );
    });
});

describe('AlertDialog', () => {
    it('uses the alertdialog role and closes from its actions', async () => {
        const onConfirm = vi.fn();
        render(
            <AlertDialog>
                <AlertDialogTrigger>Delete</AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogTitle>Delete invoice?</AlertDialogTitle>
                    <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
                    <AlertDialogClose onClick={onConfirm}>Confirm</AlertDialogClose>
                </AlertDialogContent>
            </AlertDialog>,
        );
        await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
        expect(
            await screen.findByRole('alertdialog', { name: 'Delete invoice?' }),
        ).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
        expect(onConfirm).toHaveBeenCalled();
        await waitFor(() =>
            expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
        );
    });
});

describe('Sheet', () => {
    it('opens a dialog from the chosen side', async () => {
        render(
            <Sheet>
                <SheetTrigger>Filters</SheetTrigger>
                <SheetContent side="left">
                    <SheetTitle>Filters</SheetTitle>
                </SheetContent>
            </Sheet>,
        );
        await userEvent.click(screen.getByRole('button', { name: 'Filters' }));
        const sheet = await screen.findByRole('dialog', { name: 'Filters' });
        expect(sheet).toHaveAttribute('data-side', 'left');
    });
});

describe('Popover', () => {
    it('toggles its content', async () => {
        render(
            <Popover>
                <PopoverTrigger>Share</PopoverTrigger>
                <PopoverContent>
                    <PopoverTitle>Share link</PopoverTitle>
                </PopoverContent>
            </Popover>,
        );
        const trigger = screen.getByRole('button', { name: 'Share' });
        await userEvent.click(trigger);
        expect(await screen.findByText('Share link')).toBeInTheDocument();
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });
});

describe('DropdownMenu', () => {
    it('lists items as menu items and runs the clicked action', async () => {
        const onEdit = vi.fn();
        render(
            <DropdownMenu>
                <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
                    <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
                    <DropdownMenuCheckboxItem defaultChecked>
                        Pinned
                    </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
            </DropdownMenu>,
        );
        await userEvent.click(screen.getByRole('button', { name: 'Actions' }));
        expect(await screen.findByRole('menu')).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveAttribute(
            'data-variant',
            'destructive',
        );
        expect(
            screen.getByRole('menuitemcheckbox', { name: 'Pinned' }),
        ).toHaveAttribute('aria-checked', 'true');

        await userEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));
        expect(onEdit).toHaveBeenCalled();
    });
});
