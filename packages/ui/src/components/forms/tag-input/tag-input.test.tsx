import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagInput } from '@innostes/ui';

describe('TagInput', () => {
  it('adds tags with Enter and comma, trimming and skipping duplicates', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TagInput aria-label="Skills" onValueChange={onValueChange} />);
    const input = screen.getByRole('combobox', { name: 'Skills' });

    await user.type(input, '  React {Enter}');
    await user.type(input, 'Go,');
    await user.type(input, 'react{Enter}');

    expect(onValueChange).toHaveBeenLastCalledWith(['React', 'Go']);
    expect(screen.getByRole('button', { name: 'Remove React' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Go' })).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('removes a tag with its remove button', async () => {
    const user = userEvent.setup();
    render(<TagInput aria-label="Skills" defaultValue={['React', 'Go']} />);
    await user.click(screen.getByRole('button', { name: 'Remove React' }));
    expect(screen.queryByRole('button', { name: 'Remove React' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Go' })).toBeInTheDocument();
  });

  it('splits pasted text on delimiters and new lines', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TagInput aria-label="Emails" onValueChange={onValueChange} />);
    await user.click(screen.getByRole('combobox', { name: 'Emails' }));
    await user.paste('a@x.com, b@x.com\nc@x.com');
    expect(onValueChange).toHaveBeenLastCalledWith(['a@x.com', 'b@x.com', 'c@x.com']);
  });

  it('respects max, validate and allowCustom', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <TagInput
        aria-label="Codes"
        max={2}
        validate={(t) => /^[A-Z]+$/.test(t)}
        onValueChange={onValueChange}
      />,
    );
    const input = screen.getByRole('combobox', { name: 'Codes' });
    await user.type(input, 'bad{Enter}AB{Enter}CD{Enter}');
    expect(onValueChange).toHaveBeenLastCalledWith(['AB', 'CD']);
    expect(input).toBeDisabled();
  });

  it('uses the casing of a matching suggestion and rejects unknown tags without allowCustom', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <TagInput
        aria-label="Skills"
        suggestions={['TypeScript', 'Go']}
        allowCustom={false}
        onValueChange={onValueChange}
      />,
    );
    const input = screen.getByRole('combobox', { name: 'Skills' });
    await user.type(input, 'Cobol,typescript,');
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenLastCalledWith(['TypeScript']);
  });

  it('picks a suggestion from the list', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TagInput aria-label="Skills" suggestions={['TypeScript', 'Go']} onValueChange={onValueChange} />);
    await user.type(screen.getByRole('combobox', { name: 'Skills' }), 'Typ');
    await user.click(await screen.findByRole('option', { name: 'TypeScript' }));
    expect(onValueChange).toHaveBeenLastCalledWith(['TypeScript']);
  });
});
