import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RichTextEditor } from '@innostes/ui/editor';
import type { Editor } from '@tiptap/react';

function renderEditor(props: Partial<Parameters<typeof RichTextEditor>[0]> = {}) {
  let editor: Editor | undefined;
  const utils = render(
    <RichTextEditor
      aria-label="Notes"
      onReady={(e) => {
        editor = e;
      }}
      {...props}
    />,
  );
  // Tiptap calls onCreate asynchronously, so wait for it rather than for the textbox.
  const ready = async () => {
    await waitFor(() => expect(editor).toBeDefined());
    return editor!;
  };
  return { ...utils, getEditor: () => editor!, ready };
}

describe('RichTextEditor', () => {
  it('renders a labelled multi-line textbox with a formatting toolbar', async () => {
    renderEditor({ defaultValue: '<p>Hello</p>' });
    const box = await screen.findByRole('textbox', { name: 'Notes' });
    expect(box).toHaveAttribute('aria-multiline', 'true');
    expect(box).toHaveAttribute('contenteditable', 'true');
    expect(box).toHaveTextContent('Hello');
    expect(screen.getByRole('toolbar', { name: 'Formatting' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bold' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Undo' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('formats the selection from the toolbar and reports HTML', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { getEditor, ready } = renderEditor({ defaultValue: '<p>Hello</p>', onValueChange });
    await ready();
    getEditor().commands.selectAll();

    await user.click(screen.getByRole('button', { name: 'Bold' }));
    expect(onValueChange).toHaveBeenLastCalledWith('<p><strong>Hello</strong></p>');
    expect(screen.getByRole('button', { name: 'Bold' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: 'Bulleted list' }));
    // Tiptap keeps an empty paragraph after a trailing list so the caret can leave it.
    expect(onValueChange).toHaveBeenLastCalledWith('<ul><li><p><strong>Hello</strong></p></li></ul><p></p>');

    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onValueChange).toHaveBeenLastCalledWith('<p><strong>Hello</strong></p>');
  });

  it('adds safe links and refuses javascript: URLs', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { getEditor, ready } = renderEditor({ defaultValue: '<p>Docs</p>', onValueChange });
    await ready();

    getEditor().commands.selectAll();
    await user.click(screen.getByRole('button', { name: 'Link' }));
    await user.type(screen.getByRole('textbox', { name: 'Link URL' }), 'javascript:alert(1){Enter}');
    expect(onValueChange).not.toHaveBeenCalled();

    getEditor().commands.selectAll();
    await user.click(screen.getByRole('button', { name: 'Link' }));
    await user.type(screen.getByRole('textbox', { name: 'Link URL' }), 'https://innostes.com{Enter}');
    expect(onValueChange.mock.lastCall![0]).toMatch(/<a [^>]*href="https:\/\/innostes\.com"[^>]*>Docs<\/a>/);
    expect(screen.queryByRole('textbox', { name: 'Link URL' })).not.toBeInTheDocument();
  });

  it('strips elements and attributes outside the schema', async () => {
    const onValueChange = vi.fn();
    const { ready } = renderEditor({
      defaultValue: '<p onclick="steal()">Hi<script>steal()</script><img src=x onerror="steal()"></p>',
      onValueChange,
    });
    const html = (await ready()).getHTML();
    expect(html).toBe('<p>Hi</p>');
  });

  it('follows a controlled value and submits it under name', async () => {
    const { rerender, container } = render(
      <RichTextEditor aria-label="Notes" name="notes" value="<p>One</p>" />,
    );
    const box = await screen.findByRole('textbox', { name: 'Notes' });
    expect(box).toHaveTextContent('One');
    rerender(<RichTextEditor aria-label="Notes" name="notes" value="<p>Two</p>" />);
    await waitFor(() => expect(box).toHaveTextContent('Two'));
    expect(container.querySelector('input[type=hidden][name=notes]')).toHaveValue('<p>Two</p>');
    rerender(<RichTextEditor aria-label="Notes" name="notes" value="" />);
    await waitFor(() => expect(box).toHaveTextContent(''));
  });

  it('is not editable and has no toolbar when read-only', async () => {
    renderEditor({ defaultValue: '<p>Saved</p>', readOnly: true });
    const box = await screen.findByRole('textbox', { name: 'Notes' });
    expect(box).toHaveAttribute('contenteditable', 'false');
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
  });

  it('shows only the requested tools', async () => {
    renderEditor({ toolbar: ['bold', '|', 'link'], labels: { bold: 'Gras' } });
    await screen.findByRole('textbox');
    const buttons = screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'));
    expect(buttons).toEqual(['Gras', 'Link']);
  });
});
