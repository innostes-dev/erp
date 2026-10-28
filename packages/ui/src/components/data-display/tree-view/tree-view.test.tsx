import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TreeView, type TreeNode } from '@innostes/ui';

const items: TreeNode[] = [
  {
    id: 'eng',
    label: 'Engineering',
    children: [
      { id: 'web', label: 'Web' },
      { id: 'mobile', label: 'Mobile', disabled: true },
    ],
  },
  { id: 'fin', label: 'Finance', children: [{ id: 'ap', label: 'Payables' }] },
  { id: 'hr', label: 'People' },
];

describe('TreeView', () => {
  it('exposes tree semantics', () => {
    render(<TreeView aria-label="Departments" items={items} defaultExpanded={['eng']} />);
    expect(screen.getByRole('tree', { name: 'Departments' })).toBeInTheDocument();
    const eng = screen.getByRole('treeitem', { name: /Engineering/ });
    expect(eng).toHaveAttribute('aria-expanded', 'true');
    expect(eng).toHaveAttribute('aria-level', '1');
    expect(eng).toHaveAttribute('aria-posinset', '1');
    expect(eng).toHaveAttribute('aria-setsize', '3');
    const web = screen.getByRole('treeitem', { name: 'Web' });
    expect(web).toHaveAttribute('aria-level', '2');
    expect(web).not.toHaveAttribute('aria-expanded');
    expect(screen.getByRole('treeitem', { name: /Finance/ })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('treeitem', { name: 'Payables' })).not.toBeInTheDocument();
  });

  it('has one tab stop and moves with the arrow keys, Home and End', async () => {
    const user = userEvent.setup();
    render(<TreeView aria-label="Departments" items={items} defaultExpanded={['eng']} />);
    await user.tab();
    expect(screen.getByRole('treeitem', { name: /Engineering/ })).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('treeitem', { name: 'Web' })).toHaveFocus();
    await user.keyboard('{End}');
    expect(screen.getByRole('treeitem', { name: 'People' })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(screen.getByRole('treeitem', { name: /Engineering/ })).toHaveFocus();
    const tabbable = screen.getAllByRole('treeitem').filter((el) => el.tabIndex === 0);
    expect(tabbable).toHaveLength(1);
  });

  it('expands, enters, and returns to the parent with Right and Left', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    render(<TreeView aria-label="Departments" items={items} onExpandedChange={onExpandedChange} />);
    await user.tab();
    await user.keyboard('{ArrowDown}');
    const fin = screen.getByRole('treeitem', { name: /Finance/ });
    expect(fin).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(fin).toHaveAttribute('aria-expanded', 'true');
    expect(onExpandedChange).toHaveBeenLastCalledWith(['fin']);
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('treeitem', { name: 'Payables' })).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(fin).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(fin).toHaveAttribute('aria-expanded', 'false');
  });

  it('selects with Enter and click, but not disabled nodes', async () => {
    const user = userEvent.setup();
    const onSelectedChange = vi.fn();
    render(
      <TreeView aria-label="Departments" items={items} defaultExpanded={['eng']} onSelectedChange={onSelectedChange} />,
    );
    await user.click(screen.getByText('Web'));
    expect(onSelectedChange).toHaveBeenLastCalledWith('web', items[0]!.children![0]);
    expect(screen.getByRole('treeitem', { name: 'Web' })).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{ArrowDown}{Enter}');
    expect(onSelectedChange).toHaveBeenCalledTimes(1);

    await user.keyboard('{ArrowDown}{Enter}');
    expect(onSelectedChange).toHaveBeenLastCalledWith('fin', items[1]);
  });

  it('jumps to a node by typing its first letters', async () => {
    const user = userEvent.setup();
    render(<TreeView aria-label="Departments" items={items} />);
    await user.tab();
    await user.keyboard('p');
    expect(screen.getByRole('treeitem', { name: 'People' })).toHaveFocus();
  });
});
