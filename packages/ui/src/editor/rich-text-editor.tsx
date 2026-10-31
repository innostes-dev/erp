'use client';

import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type FormEvent,
  type ReactNode,
} from 'react';
import { Toolbar } from '@base-ui/react/toolbar';
import {
  EditorContent,
  useEditor,
  useEditorState,
  type Editor,
} from '@tiptap/react';
import type { AnyExtension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extensions';
import { cn } from '../lib/cn';
import type { SlotClassNames } from '../lib/slots';
import { useControllableState } from '../lib/use-controllable-state';
import { useId } from '../lib/use-id';
import { Button } from '../components/actions/button/button';
import { Input } from '../components/forms/input/input';
import {
  BoldIcon,
  CodeIcon,
  HeadingIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  RedoIcon,
  StrikethroughIcon,
  UnderlineIcon,
  UndoIcon,
} from './editor-icons';

/** A toolbar button of the `RichTextEditor`. */
export type RichTextTool =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'heading'
  | 'bulletList'
  | 'orderedList'
  | 'blockquote'
  | 'code'
  | 'link'
  | 'undo'
  | 'redo';

/** Texts of the `RichTextEditor`, for translation. */
export type RichTextEditorLabels = Partial<Record<RichTextTool, string>> & {
  /** @default 'Formatting' */
  toolbar?: string;
  /** @default 'Link URL' */
  linkUrl?: string;
  /** @default 'Apply' */
  applyLink?: string;
  /** @default 'Remove link' */
  removeLink?: string;
  /** @default 'Cancel' */
  cancel?: string;
};

export type RichTextEditorSlot =
  'root' | 'toolbar' | 'button' | 'content' | 'linkForm';

export interface RichTextEditorProps extends Omit<
  ComponentProps<'div'>,
  'defaultValue' | 'onChange' | 'children'
> {
  /** The content as HTML (controlled). An empty editor is `''`. */
  value?: string;
  /** The initial content as HTML (uncontrolled). @default '' */
  defaultValue?: string;
  /** Called with the HTML after every change. An empty editor gives `''`. */
  onValueChange?: (html: string) => void;
  /** Text shown while the editor is empty. */
  placeholder?: string;
  /** Submits the HTML under this name in a `<form>`. */
  name?: string;
  /** Prevents editing and dims the editor. @default false */
  disabled?: boolean;
  /** Prevents editing and hides the toolbar, e.g. to display saved notes. @default false */
  readOnly?: boolean;
  /** Mark the field as invalid (e.g. from form validation). @default false */
  invalid?: boolean;
  /**
   * Toolbar buttons in order; `'|'` adds a divider. `false` hides the toolbar (Markdown-style
   * shortcuts like `**bold**` and `- list` still work).
   * @default ['bold', 'italic', 'underline', 'strike', '|', 'heading', 'bulletList', 'orderedList', 'blockquote', '|', 'link', 'code', '|', 'undo', 'redo']
   */
  toolbar?: readonly (RichTextTool | '|')[] | false;
  /** Extra Tiptap extensions, e.g. character count or mentions. */
  extensions?: AnyExtension[];
  /** Called once with the Tiptap editor, for advanced control (inserting content, reading text). */
  onReady?: (editor: Editor) => void;
  /** Texts, for translation. */
  labels?: RichTextEditorLabels;
  /** Classes for inner parts. `content` sets the editing area, e.g. its min height. */
  classNames?: SlotClassNames<RichTextEditorSlot>;
}

const defaultToolbar: readonly (RichTextTool | '|')[] = [
  'bold',
  'italic',
  'underline',
  'strike',
  '|',
  'heading',
  'bulletList',
  'orderedList',
  'blockquote',
  '|',
  'link',
  'code',
  '|',
  'undo',
  'redo',
];

const tools: Record<
  RichTextTool,
  { label: string; icon: ReactNode; shortcut?: string }
> = {
  bold: { label: 'Bold', icon: <BoldIcon />, shortcut: 'Mod+B' },
  italic: { label: 'Italic', icon: <ItalicIcon />, shortcut: 'Mod+I' },
  underline: { label: 'Underline', icon: <UnderlineIcon />, shortcut: 'Mod+U' },
  strike: {
    label: 'Strikethrough',
    icon: <StrikethroughIcon />,
    shortcut: 'Mod+Shift+S',
  },
  heading: { label: 'Heading', icon: <HeadingIcon /> },
  bulletList: {
    label: 'Bulleted list',
    icon: <ListIcon />,
    shortcut: 'Mod+Shift+8',
  },
  orderedList: {
    label: 'Numbered list',
    icon: <ListOrderedIcon />,
    shortcut: 'Mod+Shift+7',
  },
  blockquote: { label: 'Quote', icon: <QuoteIcon />, shortcut: 'Mod+Shift+B' },
  code: { label: 'Inline code', icon: <CodeIcon />, shortcut: 'Mod+E' },
  link: { label: 'Link', icon: <LinkIcon /> },
  undo: { label: 'Undo', icon: <UndoIcon />, shortcut: 'Mod+Z' },
  redo: { label: 'Redo', icon: <RedoIcon />, shortcut: 'Mod+Shift+Z' },
};

const htmlOf = (editor: Editor) => (editor.isEmpty ? '' : editor.getHTML());

const contentClass = [
  'min-h-32 px-3 py-2 text-sm leading-relaxed text-foreground outline-none',
  '[&_p]:my-1.5 [&_h2]:mt-3 [&_h2]:mb-1.5 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:text-base [&_h3]:font-semibold',
  '[&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:ps-6 [&_ol]:my-1.5 [&_ol]:list-decimal [&_ol]:ps-6 [&_li_p]:my-0.5',
  '[&_blockquote]:my-2 [&_blockquote]:border-s-2 [&_blockquote]:border-border [&_blockquote]:ps-3 [&_blockquote]:text-muted-foreground',
  '[&_code]:rounded-sm [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em]',
  '[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0',
  '[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_hr]:my-3 [&_hr]:border-border',
  '[&_p.is-editor-empty:first-child]:before:pointer-events-none [&_p.is-editor-empty:first-child]:before:float-start [&_p.is-editor-empty:first-child]:before:h-0',
  '[&_p.is-editor-empty:first-child]:before:text-muted-foreground [&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]',
].join(' ');

/**
 * A rich text field for notes, descriptions, comments and email templates: bold, italic,
 * headings, lists, quotes, links and undo, with Markdown-style shortcuts (`**bold**`,
 * `- list`). Built on Tiptap; the value is HTML that only contains the supported elements,
 * because pasted content is parsed against the editor's schema.
 *
 * Import it from `@innostes/ui/editor` and install the Tiptap peer dependencies.
 *
 * @example
 * <RichTextEditor
 *   aria-label="Notes"
 *   placeholder="Add delivery instructions…"
 *   value={notes}
 *   onValueChange={setNotes}
 * />
 */
export const RichTextEditor = forwardRef<HTMLDivElement, RichTextEditorProps>(
  function RichTextEditor(
    {
      value,
      defaultValue = '',
      onValueChange,
      placeholder,
      name,
      disabled = false,
      readOnly = false,
      invalid = false,
      toolbar = defaultToolbar,
      extensions = [],
      onReady,
      labels,
      className,
      classNames,
      id,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref,
  ) {
    const [html, setHtml] = useControllableState({
      value,
      defaultValue,
      onChange: onValueChange,
    });
    const setHtmlRef = useRef(setHtml);
    setHtmlRef.current = setHtml;
    const htmlRef = useRef(html);
    htmlRef.current = html;
    const onReadyRef = useRef(onReady);
    onReadyRef.current = onReady;
    const baseId = useId(id);
    const editable = !disabled && !readOnly;

    const editor = useEditor({
      // Render on the client only, so server-rendered pages don't mismatch.
      immediatelyRender: false,
      editable,
      content: html,
      extensions: [
        StarterKit.configure({
          heading: { levels: [2, 3] },
          link: {
            openOnClick: false,
            autolink: true,
            defaultProtocol: 'https',
          },
        }),
        Placeholder.configure({ placeholder: placeholder ?? '' }),
        ...extensions,
      ],
      editorProps: {
        attributes: {
          id: baseId,
          role: 'textbox',
          'aria-multiline': 'true',
          ...(invalid ? { 'aria-invalid': 'true' } : {}),
          ...(ariaLabel ? { 'aria-label': ariaLabel } : {}),
          ...(ariaLabelledBy ? { 'aria-labelledby': ariaLabelledBy } : {}),
          ...(ariaDescribedBy ? { 'aria-describedby': ariaDescribedBy } : {}),
          'data-slot': 'rich-text-editor-content',
          class: cn(contentClass, classNames?.content),
        },
      },
      onCreate: ({ editor: e }) => onReadyRef.current?.(e),
      // Commands that change nothing (e.g. a refused link) still fire updates; skip those.
      onUpdate: ({ editor: e }) => {
        const next = htmlOf(e);
        if (next !== htmlRef.current) setHtmlRef.current(next);
      },
    });

    useEffect(() => {
      if (!editor || editor.isDestroyed) return;
      if (html !== htmlOf(editor))
        editor.commands.setContent(html, { emitUpdate: false });
    }, [editor, html]);

    useEffect(() => {
      if (editor && !editor.isDestroyed) editor.setEditable(editable);
    }, [editor, editable]);

    const state = useEditorState({
      editor,
      selector: ({ editor: e }) => {
        if (!e) return null;
        return {
          bold: e.isActive('bold'),
          italic: e.isActive('italic'),
          underline: e.isActive('underline'),
          strike: e.isActive('strike'),
          heading: e.isActive('heading'),
          bulletList: e.isActive('bulletList'),
          orderedList: e.isActive('orderedList'),
          blockquote: e.isActive('blockquote'),
          code: e.isActive('code'),
          link: e.isActive('link'),
          undo: e.can().undo(),
          redo: e.can().redo(),
        };
      },
    });

    const [linkOpen, setLinkOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const linkInput = useRef<HTMLElement>(null);
    useEffect(() => {
      if (linkOpen) linkInput.current?.focus();
    }, [linkOpen]);

    const run = (tool: RichTextTool) => {
      if (!editor) return;
      const chain = editor.chain().focus();
      switch (tool) {
        case 'bold':
          return chain.toggleBold().run();
        case 'italic':
          return chain.toggleItalic().run();
        case 'underline':
          return chain.toggleUnderline().run();
        case 'strike':
          return chain.toggleStrike().run();
        case 'heading':
          return chain.toggleHeading({ level: 2 }).run();
        case 'bulletList':
          return chain.toggleBulletList().run();
        case 'orderedList':
          return chain.toggleOrderedList().run();
        case 'blockquote':
          return chain.toggleBlockquote().run();
        case 'code':
          return chain.toggleCode().run();
        case 'undo':
          return chain.undo().run();
        case 'redo':
          return chain.redo().run();
        case 'link':
          setLinkUrl(
            (editor.getAttributes('link').href as string | undefined) ?? '',
          );
          setLinkOpen(true);
          return;
      }
    };

    const closeLink = () => {
      setLinkOpen(false);
      editor?.commands.focus();
    };

    const applyLink = (event: FormEvent) => {
      event.preventDefault();
      if (!editor) return;
      const url = linkUrl.trim();
      const chain = editor.chain().focus().extendMarkRange('link');
      if (url) chain.setLink({ href: url }).run();
      else chain.unsetLink().run();
      setLinkOpen(false);
    };

    const isMac =
      typeof navigator !== 'undefined' &&
      /Mac|iPhone|iPad/.test(navigator.platform);
    const t = (tool: RichTextTool) => labels?.[tool] ?? tools[tool].label;
    const showToolbar = toolbar !== false && !readOnly;

    return (
      <div
        ref={ref}
        data-slot="rich-text-editor"
        data-disabled={disabled ? '' : undefined}
        data-readonly={readOnly ? '' : undefined}
        data-invalid={invalid ? '' : undefined}
        className={cn(
          'flex w-full flex-col overflow-hidden rounded-md border border-input bg-background shadow-xs transition-[color,box-shadow,border-color]',
          'focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/25',
          'data-disabled:cursor-not-allowed data-disabled:opacity-50',
          'data-readonly:border-transparent data-readonly:bg-transparent data-readonly:shadow-none data-readonly:focus-within:ring-0',
          'data-invalid:border-destructive data-invalid:focus-within:ring-destructive/25',
          classNames?.root,
          className,
        )}
        {...props}
      >
        {showToolbar && (
          <Toolbar.Root
            aria-label={labels?.toolbar ?? 'Formatting'}
            aria-controls={baseId}
            data-slot="rich-text-editor-toolbar"
            className={cn(
              'flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/40 p-1',
              classNames?.toolbar,
            )}
          >
            {toolbar.map((tool, i) =>
              tool === '|' ? (
                <Toolbar.Separator
                  key={`sep-${i}`}
                  className="mx-1 h-5 w-px bg-border"
                />
              ) : (
                <Toolbar.Button
                  key={tool}
                  data-slot="rich-text-editor-button"
                  aria-label={t(tool)}
                  title={
                    tools[tool].shortcut
                      ? `${t(tool)} (${tools[tool].shortcut!.replace('Mod', isMac ? '⌘' : 'Ctrl')})`
                      : t(tool)
                  }
                  aria-pressed={
                    tool === 'undo' || tool === 'redo'
                      ? undefined
                      : !!state?.[tool]
                  }
                  disabled={
                    !editor ||
                    disabled ||
                    ((tool === 'undo' || tool === 'redo') && !state?.[tool])
                  }
                  onClick={() => run(tool)}
                  className={cn(
                    'flex size-8 cursor-pointer items-center justify-center rounded-sm text-muted-foreground outline-none',
                    'hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring',
                    'aria-pressed:bg-accent aria-pressed:text-foreground',
                    'data-disabled:cursor-not-allowed data-disabled:opacity-40',
                    "[&_svg:not([class*='size-'])]:size-4",
                    classNames?.button,
                  )}
                >
                  {tools[tool].icon}
                </Toolbar.Button>
              ),
            )}
          </Toolbar.Root>
        )}

        {linkOpen && (
          <form
            onSubmit={applyLink}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                closeLink();
              }
            }}
            data-slot="rich-text-editor-link-form"
            className={cn(
              'flex flex-wrap items-center gap-2 border-b border-border px-2 py-2',
              classNames?.linkForm,
            )}
          >
            <Input
              ref={linkInput}
              size="sm"
              type="url"
              inputMode="url"
              placeholder="https://"
              aria-label={labels?.linkUrl ?? 'Link URL'}
              value={linkUrl}
              onChange={(e) => setLinkUrl((e.target as HTMLInputElement).value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault();
                  e.stopPropagation();
                  closeLink();
                }
              }}
              className="min-w-48 flex-1"
            />
            <Button type="submit" size="sm">
              {labels?.applyLink ?? 'Apply'}
            </Button>
            {state?.link && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  editor
                    ?.chain()
                    .focus()
                    .extendMarkRange('link')
                    .unsetLink()
                    .run();
                  setLinkOpen(false);
                }}
              >
                {labels?.removeLink ?? 'Remove link'}
              </Button>
            )}
            <Button type="button" size="sm" variant="ghost" onClick={closeLink}>
              {labels?.cancel ?? 'Cancel'}
            </Button>
          </form>
        )}

        {editor ? (
          <EditorContent editor={editor} className="flex-1 overflow-y-auto" />
        ) : (
          <div
            aria-hidden="true"
            className={cn(contentClass, classNames?.content)}
          />
        )}
        {name && (
          <input type="hidden" name={name} value={html} disabled={disabled} />
        )}
      </div>
    );
  },
);
