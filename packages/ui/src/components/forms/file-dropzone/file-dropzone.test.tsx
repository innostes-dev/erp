import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileDropzone, fileMatchesAccept, formatBytes } from '@innostes/ui';

const file = (name: string, type: string, size = 10) =>
  new File([new Uint8Array(size)], name, { type });

function drop(files: File[]) {
  const zone = document.querySelector('[data-slot=file-dropzone-zone]')!;
  fireEvent.dragOver(zone, { dataTransfer: { files, dropEffect: 'none' } });
  fireEvent.drop(zone, { dataTransfer: { files } });
}

describe('file helpers', () => {
  it('matches accept rules by extension, MIME type and wildcard', () => {
    const pdf = file('a.PDF', 'application/pdf');
    expect(fileMatchesAccept(pdf, '.pdf')).toBe(true);
    expect(fileMatchesAccept(pdf, 'application/pdf')).toBe(true);
    expect(fileMatchesAccept(pdf, 'image/*')).toBe(false);
    expect(fileMatchesAccept(file('x.png', 'image/png'), 'image/*, .pdf')).toBe(true);
    expect(fileMatchesAccept(pdf, undefined)).toBe(true);
  });

  it('formats byte counts', () => {
    expect(formatBytes(512, 'en')).toBe('512 bytes');
    expect(formatBytes(1536, 'en')).toBe('1.5 kB');
    expect(formatBytes(5_000_000, 'en')).toBe('5 MB');
  });
});

describe('FileDropzone', () => {
  it('adds picked files and lists them with a remove button', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(<FileDropzone name="docs" onValueChange={onValueChange} />);
    const input = container.querySelector('input[type=file]') as HTMLInputElement;
    const a = file('a.pdf', 'application/pdf');
    await user.upload(input, [a]);
    expect(onValueChange).toHaveBeenLastCalledWith([a]);
    expect(screen.getByText('a.pdf')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove a.pdf' }));
    expect(onValueChange).toHaveBeenLastCalledWith([]);
    expect(screen.queryByText('a.pdf')).not.toBeInTheDocument();
  });

  it('accepts dropped files and rejects wrong types, large files and extra files', () => {
    const onValueChange = vi.fn();
    const onReject = vi.fn();
    render(
      <FileDropzone
        accept=".pdf"
        maxSize={100}
        maxFiles={1}
        onValueChange={onValueChange}
        onReject={onReject}
      />,
    );
    const ok = file('ok.pdf', 'application/pdf');
    const big = file('big.pdf', 'application/pdf', 500);
    const img = file('img.png', 'image/png');
    const extra = file('extra.pdf', 'application/pdf');
    drop([ok, big, img, extra]);

    expect(onValueChange).toHaveBeenLastCalledWith([ok]);
    expect(onReject).toHaveBeenCalledWith([
      { file: big, reasons: ['size'] },
      { file: img, reasons: ['type'] },
      { file: extra, reasons: ['count'] },
    ]);
    expect(screen.getByRole('alert')).toHaveTextContent('big.pdf: file too large');
  });

  it('replaces the file when multiple is off', () => {
    const onValueChange = vi.fn();
    render(<FileDropzone multiple={false} onValueChange={onValueChange} />);
    const a = file('a.pdf', 'application/pdf');
    const b = file('b.pdf', 'application/pdf');
    drop([a]);
    drop([b]);
    expect(onValueChange).toHaveBeenLastCalledWith([b]);
  });

  it('ignores drops when disabled', () => {
    const onValueChange = vi.fn();
    render(<FileDropzone disabled onValueChange={onValueChange} />);
    drop([file('a.pdf', 'application/pdf')]);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Browse files' })).toBeDisabled();
  });
});
