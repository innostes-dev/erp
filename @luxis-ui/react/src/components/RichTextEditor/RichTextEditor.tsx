"use client";

import { CloseSmallIcon } from '../../icons/IconComponents';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useId } from '../../hooks';
import { Size, useThemeContext } from '../../theme';
import './RichTextEditor.css';

export interface RichTextEditorProps {
  /**
   * Label text displayed above the editor
   */
  label?: string;
  /**
   * Helper text displayed below the editor
   * Provides additional context or instructions
   */
  helperText?: string;
  /**
   * Error message - when provided, editor is shown in error state
   * Takes precedence over helperText when both are present
   */
  error?: string;
  /**
   * Success message - when provided, editor is shown in success state
   */
  success?: string;
  /**
   * Size of the editor
   * @default theme.global.size
   */
  size?: Size;
  /**
   * If true, editor will take full width of its container
   * @default true
   */
  fullWidth?: boolean;
  /**
   * If true, shows a clear button when editor has content
   * @default false
   */
  clearable?: boolean;
  /**
   * Callback fired when clear button is clicked
   */
  onClear?: () => void;
  /**
   * If true, shows a character counter below the editor
   * @default false
   */
  showCount?: boolean;
  /**
   * Maximum character length
   */
  maxLength?: number;
  /**
   * Custom class name for the wrapper element
   */
  wrapperClassName?: string;
  /**
   * Custom class name for the label element
   */
  labelClassName?: string;
  /**
   * Custom class name for the editor element itself
   */
  editorClassName?: string;
  /**
   * Custom class name for the toolbar
   */
  toolbarClassName?: string;
  /**
   * If true, the field is required
   */
  required?: boolean;
  /**
   * If true, the editor is disabled
   */
  disabled?: boolean;
  /**
   * Placeholder text
   */
  placeholder?: string;
  /**
   * HTML content of the editor
   */
  value?: string;
  /**
   * Default HTML content
   */
  defaultValue?: string;
  /**
   * Callback fired when content changes
   */
  onChange?: (html: string, text: string) => void;
  /**
   * Minimum height of the editor area in pixels
   * @default 200
   */
  minHeight?: number;
  /**
   * Custom id for the editor
   */
  id?: string;
  /**
   * If true, hides the toolbar
   * @default false
   */
  hideToolbar?: boolean;
  /**
   * Custom toolbar buttons to show
   * @default all buttons
   */
  toolbarButtons?: ToolbarButton[];
  /**
   * Custom handler for the 'Insert Link' toolbar action.
   * Receives a callback that must be invoked with the resolved URL.
   * Use this to replace the default browser prompt with your own modal or input.
   * @example
   * onInsertLink={(insert) => openLinkModal().then((url) => insert(url))}
   */
  onInsertLink?: (insert: (url: string) => void) => void;
  /**
   * HTML sanitizer applied before setting innerHTML from the `value` prop.
   * Use this to strip potentially dangerous markup before it is rendered.
   * @example sanitize={(html) => DOMPurify.sanitize(html)}
   */
  sanitize?: (html: string) => string;
  /**
   * Accessible label for the editor area. Required when no `label` prop is provided.
   */
  'aria-label'?: string;
  /**
   * Callback fired when the editor gains focus
   */
  onFocus?: React.FocusEventHandler<HTMLDivElement>;
  /**
   * Callback fired when the editor loses focus
   */
  onBlur?: React.FocusEventHandler<HTMLDivElement>;
  /**
   * Callback fired on keydown inside the editor
   */
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
}

export type ToolbarButton =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikethrough'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'orderedList'
  | 'unorderedList'
  | 'link'
  | 'alignLeft'
  | 'alignCenter'
  | 'alignRight'
  | 'code'
  | 'clearFormat'
  | 'undo'
  | 'redo';

const defaultToolbarButtons: ToolbarButton[] = [
  'bold',
  'italic',
  'underline',
  'strikethrough',
  'h1',
  'h2',
  'h3',
  'orderedList',
  'unorderedList',
  'link',
  'alignLeft',
  'alignCenter',
  'alignRight',
  'code',
  'clearFormat',
  'undo',
  'redo',
];

/**
 * RichTextEditor component - A WYSIWYG text editor with formatting toolbar
 *
 * A comprehensive rich text editor with support for text formatting, lists, links,
 * alignment, and character counting.
 *
 * @example
 * Basic usage
 * ```tsx
 * <RichTextEditor
 *   label="Article Content"
 *   placeholder="Start writing..."
 *   onChange={(html, text) => setContent(html)}
 * />
 * ```
 *
 * @example
 * With character limit
 * ```tsx
 * <RichTextEditor
 *   label="Description"
 *   maxLength={500}
 *   showCount
 *   value={description}
 *   onChange={(html, text) => setDescription(html)}
 * />
 * ```
 *
 * @example
 * With validation
 * ```tsx
 * <RichTextEditor
 *   label="Comment"
 *   required
 *   error={error}
 *   value={comment}
 *   onChange={(html, text) => handleChange(html, text)}
 * />
 * ```
 */
const RichTextEditor = React.forwardRef<HTMLDivElement, RichTextEditorProps>(
  (
    {
      label,
      helperText,
      error,
      success,
      size,
      fullWidth = true,
      clearable = false,
      onClear,
      showCount = false,
      maxLength,
      wrapperClassName = '',
      labelClassName = '',
      editorClassName = '',
      toolbarClassName = '',
      required = false,
      disabled = false,
      placeholder = 'Start typing...',
      value,
      defaultValue,
      onChange,
      minHeight = 200,
      id: providedId,
      hideToolbar = false,
      toolbarButtons = defaultToolbarButtons,
      onInsertLink,
      sanitize,
      'aria-label': ariaLabel,
      onFocus: externalOnFocus,
      onBlur: externalOnBlur,
      onKeyDown: externalOnKeyDown,
    },
    ref
  ) => {
    const { theme } = useThemeContext();
    const editorSize = size ?? theme.global.size;

    const generatedId = useId('richtext');
    const id = providedId || generatedId;
    const helperId = `${id}-helper`;
    const errorId = `${id}-error`;
    const successId = `${id}-success`;

    const editorRef = useRef<HTMLDivElement | null>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [currentLength, setCurrentLength] = useState(0);

    const hasError = Boolean(error);
    const hasSuccess = Boolean(success) && !hasError;
    const showClearButton = clearable && currentLength > 0 && !disabled;

    const describedBy = [
      helperText && !error && !success && helperId,
      error && errorId,
      success && successId,
    ]
      .filter(Boolean)
      .join(' ');

    const wrapperClassNames = [
      'lxs-richtext-wrapper',
      !fullWidth && 'lxs-richtext-wrapper--inline',
      wrapperClassName,
    ]
      .filter(Boolean)
      .join(' ');

    const containerClassNames = [
      'lxs-richtext-container',
      `lxs-richtext-container--${editorSize}`,
      hasError && 'lxs-richtext-container--error',
      hasSuccess && 'lxs-richtext-container--success',
      disabled && 'lxs-richtext-container--disabled',
      isFocused && 'lxs-richtext-container--focused',
    ]
      .filter(Boolean)
      .join(' ');

    const editorClasses = [
      'lxs-richtext-editor',
      editorClassName,
    ]
      .filter(Boolean)
      .join(' ');

    const toolbarClasses = [
      'lxs-richtext-toolbar',
      toolbarClassName,
    ]
      .filter(Boolean)
      .join(' ');

    const sanitizeHtml = useCallback(
      (html: string): string => (sanitize ? sanitize(html) : html),
      [sanitize]
    );

    // Initialize content — runs once on mount
    useEffect(() => {
      if (editorRef.current && !editorRef.current.innerHTML) {
        const initialContent = value ?? defaultValue ?? '';
        editorRef.current.innerHTML = sanitizeHtml(initialContent);
        updateLength();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // intentional empty-deps: only set initial content on mount

    // Update content when value changes (controlled mode)
    useEffect(() => {
      if (value !== undefined && editorRef.current) {
        const currentHtml = editorRef.current.innerHTML;
        if (currentHtml !== value) {
          editorRef.current.innerHTML = sanitizeHtml(value);
          updateLength();
        }
      }
    }, [value, sanitizeHtml]);

    const updateLength = () => {
      if (editorRef.current) {
        const text = editorRef.current.innerText || '';
        setCurrentLength(text.length);
      }
    };

    const handleInput = () => {
      if (!editorRef.current) return;
      const html = editorRef.current.innerHTML;
      const text = editorRef.current.innerText || '';
      updateLength();
      onChange?.(html, text);
    };

    // Block new characters once maxLength is reached — must run before DOM update
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (maxLength) {
        const text = editorRef.current?.innerText ?? '';
        if (text.length >= maxLength) {
          const isNavigationKey = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight',
            'ArrowUp', 'ArrowDown', 'Home', 'End', 'Tab'].includes(e.key);
          const isModifierCombo = e.ctrlKey || e.metaKey; // allow Ctrl+A, Ctrl+C, etc.
          if (!isNavigationKey && !isModifierCombo) {
            e.preventDefault();
          }
        }
      }
      externalOnKeyDown?.(e);
    };

    const handleClear = () => {
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
        updateLength();
        onChange?.('', '');
      }
      onClear?.();
      editorRef.current?.focus();
    };

    // NOSONAR — execCommand is deprecated per MDN but remains the only cross-browser
    // API for basic contentEditable formatting; no modern programmatic replacement exists.
    const execCommand = (command: string, cmdValue?: string) => {
      document.execCommand(command, false, cmdValue); // NOSONAR
      editorRef.current?.focus();
    };

    // Map simple toolbar actions to their execCommand equivalents
    const execCommandMap: Partial<Record<ToolbarButton, [string, string?]>> = {
      bold:          ['bold'],
      italic:        ['italic'],
      underline:     ['underline'],
      strikethrough: ['strikeThrough'],
      h1:            ['formatBlock', '<h1>'],
      h2:            ['formatBlock', '<h2>'],
      h3:            ['formatBlock', '<h3>'],
      orderedList:   ['insertOrderedList'],
      unorderedList: ['insertUnorderedList'],
      alignLeft:     ['justifyLeft'],
      alignCenter:   ['justifyCenter'],
      alignRight:    ['justifyRight'],
      code:          ['formatBlock', '<pre>'],
      clearFormat:   ['removeFormat'],
      undo:          ['undo'],
      redo:          ['redo'],
    };

    // Validate and insert a hyperlink — blocks javascript: protocol to prevent XSS
    const insertLink = (url: string) => {
      const sanitized = url.trim();
      if (!sanitized || /^javascript:/i.test(sanitized)) return; // NOSONAR — intentional XSS guard
      execCommand('createLink', sanitized);
      handleInput();
    };

    const handleToolbarAction = (action: ToolbarButton) => {
      if (disabled) return;

      if (action === 'link') {
        if (onInsertLink) {
          onInsertLink(insertLink);
        } else {
          const url = globalThis.prompt('Enter URL:');
          if (url) insertLink(url);
        }
        return;
      }

      const entry = execCommandMap[action];
      if (entry) {
        execCommand(entry[0], entry[1]);
        handleInput();
      }
    };

    const handleRef = (node: HTMLDivElement | null) => {
      editorRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    const showCounter = showCount || maxLength !== undefined;
    const isNearLimit = maxLength !== undefined && currentLength >= maxLength * 0.9;
    const isAtLimit = maxLength !== undefined && currentLength >= maxLength;
    const counterDisplay = maxLength === undefined
      ? `${currentLength}`
      : `${currentLength} / ${maxLength}`;

    const getCounterClass = (): string => {
      if (isAtLimit) return 'lxs-richtext-counter lxs-richtext-counter--at-limit';
      if (isNearLimit) return 'lxs-richtext-counter lxs-richtext-counter--near-limit';
      return 'lxs-richtext-counter';
    };

    const getButtonIcon = (button: ToolbarButton): string => {
      const icons: Record<ToolbarButton, string> = {
        bold: 'B',
        italic: 'I',
        underline: 'U',
        strikethrough: 'S',
        h1: 'H1',
        h2: 'H2',
        h3: 'H3',
        orderedList: '1.',
        unorderedList: '•',
        link: '🔗',
        alignLeft: '⬅',
        alignCenter: '⬌',
        alignRight: '➡',
        code: '<>',
        clearFormat: '✕',
        undo: '↶',
        redo: '↷',
      };
      return icons[button];
    };

    const getButtonTitle = (button: ToolbarButton): string => {
      const titles: Record<ToolbarButton, string> = {
        bold: 'Bold',
        italic: 'Italic',
        underline: 'Underline',
        strikethrough: 'Strikethrough',
        h1: 'Heading 1',
        h2: 'Heading 2',
        h3: 'Heading 3',
        orderedList: 'Ordered List',
        unorderedList: 'Unordered List',
        link: 'Insert Link',
        alignLeft: 'Align Left',
        alignCenter: 'Align Center',
        alignRight: 'Align Right',
        code: 'Code Block',
        clearFormat: 'Clear Formatting',
        undo: 'Undo',
        redo: 'Redo',
      };
      return titles[button];
    };

    return (
      <div className={wrapperClassNames}>
        {label && (
          // onClick forwards focus to contenteditable — htmlFor alone does not activate non-labelable elements
          // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
          <label
            htmlFor={id}
            onClick={() => editorRef.current?.focus()}
            onKeyDown={undefined}
            className={`lxs-richtext-label ${labelClassName}`.trim()}
          >
            {label}
            {required && (
              <span className="lxs-richtext-label__required" aria-label="required">
                {' '}
                *
              </span>
            )}
          </label>
        )}
        <div className={containerClassNames}>
          {!hideToolbar && (
            <div className={toolbarClasses} role="toolbar" aria-label="Text formatting toolbar">
              {toolbarButtons.map((button) => (
                <button
                  key={button}
                  type="button"
                  className="lxs-richtext-toolbar-button"
                  onClick={() => handleToolbarAction(button)}
                  disabled={disabled}
                  title={getButtonTitle(button)}
                  aria-label={getButtonTitle(button)}
                  tabIndex={-1}
                >
                  {getButtonIcon(button)}
                </button>
              ))}
              {showClearButton && (
                <button
                  type="button"
                  className="lxs-richtext-toolbar-clear"
                  onClick={handleClear}
                  disabled={disabled}
                  title="Clear all content"
                  aria-label="Clear all content"
                  tabIndex={-1}
                >
                  <CloseSmallIcon size={14} />
                </button>
              )}
            </div>
          )}
          {/* contentEditable with role="textbox" is the correct WAI-ARIA pattern for rich text.
               A native <textarea> cannot render formatted content. */}
          <div // NOSONAR — contentEditable rich-text requires role="textbox"; <textarea>/<input> cannot render formatted markup
            ref={handleRef}
            id={id}
            className={editorClasses}
            contentEditable={!disabled}
            tabIndex={disabled ? -1 : 0}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={(e) => { setIsFocused(true); externalOnFocus?.(e); }}
            onBlur={(e) => { setIsFocused(false); externalOnBlur?.(e); }}
            role="textbox"
            aria-multiline="true"
            aria-invalid={hasError}
            aria-describedby={describedBy || undefined}
            aria-required={required}
            aria-label={ariaLabel}
            data-placeholder={placeholder}
            style={{ minHeight: `${minHeight}px` }}
            suppressContentEditableWarning
          />
        </div>
        <div className="lxs-richtext-footer">
          <div className="lxs-richtext-footer-left">
            {helperText && !error && !success && (
              <p id={helperId} className="lxs-richtext-helper">
                {helperText}
              </p>
            )}
            {error && (
              <p id={errorId} className="lxs-richtext-error" role="alert">
                {error}
              </p>
            )}
            {success && (
              <output id={successId} className="lxs-richtext-success">
                {success}
              </output>
            )}
          </div>
          {showCounter && (
            <p className={getCounterClass()} aria-live="polite">
              {counterDisplay}
            </p>
          )}
        </div>
      </div>
    );
  }
);

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;
export { RichTextEditor };
