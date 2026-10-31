'use client';

import {
  forwardRef,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { Combobox as BaseCombobox } from '@base-ui/react/combobox';
import { cn } from '../../../lib/cn';
import { CheckIcon, PlusIcon, XIcon } from '../../../lib/icons';
import { listItem, popupSurface } from '../../../lib/styles';
import type { SlotClassNames } from '../../../lib/slots';
import { useControllableState } from '../../../lib/use-controllable-state';
import { inputVariants, type InputSize } from '../input/input-variants';

export type TagInputSlot =
  'root' | 'tag' | 'tagRemove' | 'input' | 'popup' | 'item';

export interface TagInputProps {
  /** The tags (controlled). */
  value?: string[];
  /** The initial tags (uncontrolled). @default [] */
  defaultValue?: string[];
  /** Called with the new list when a tag is added or removed. */
  onValueChange?: (value: string[]) => void;
  /** Known tags offered in a filtered list while typing. Without it, no list is shown. */
  suggestions?: readonly string[];
  /** Allow tags that aren't in `suggestions`. @default true */
  allowCustom?: boolean;
  /** Characters that commit the typed text as a tag, besides Enter. Pasted text is split on them too. @default [','] */
  delimiters?: readonly string[];
  /** Maximum number of tags. The input is disabled once reached. */
  max?: number;
  /**
   * Checks a new tag before it is added. Return `false` to reject it. Tags are already trimmed,
   * and case-insensitive duplicates are always rejected.
   */
  validate?: (tag: string) => boolean;
  /** Placeholder while there are no tags. */
  placeholder?: string;
  /** Submits each tag under this name, like a multi-select. */
  name?: string;
  /** Disables the whole input. @default false */
  disabled?: boolean;
  /** Accessible name when there's no visible label. */
  'aria-label'?: string;
  /** Id of the input, for an external `<label htmlFor>`. */
  id?: string;
  /** Height and text size, matching `Input`. @default 'md' */
  size?: InputSize;
  /** Text for the "add" option in the suggestions list. @default (tag) => `Add "${tag}"` */
  addLabel?: (tag: string) => ReactNode;
  /** Label for each tag's remove button. @default (tag) => `Remove ${tag}` */
  removeLabel?: (tag: string) => string;
  /** Extra classes for the root. */
  className?: string;
  /** Classes for inner parts. */
  classNames?: SlotClassNames<TagInputSlot>;
}

const minHeight: Record<InputSize, string> = {
  sm: 'min-h-8 py-0.5 ps-1',
  md: 'min-h-10 py-1 ps-1.5',
  lg: 'min-h-12 py-1.5 ps-2',
};

/**
 * A text field that turns entries into removable tags: labels, skills, email recipients,
 * SKUs. Type and press Enter or a comma to add; Backspace on an empty input focuses the last
 * tag, and Backspace on a tag removes it. Pass `suggestions` to offer known tags in a
 * filtered list. Built on Base UI's multi-select Combobox.
 *
 * @example
 * <TagInput
 *   aria-label="Skills"
 *   suggestions={['React', 'TypeScript', 'Go']}
 *   defaultValue={['React']}
 *   max={5}
 * />
 */
export const TagInput = forwardRef<HTMLDivElement, TagInputProps>(
  function TagInput(
    {
      value,
      defaultValue = [],
      onValueChange,
      suggestions,
      allowCustom = true,
      delimiters = [','],
      max,
      validate,
      placeholder,
      name,
      disabled = false,
      id,
      size = 'md',
      addLabel = (tag) => `Add "${tag}"`,
      removeLabel = (tag) => `Remove ${tag}`,
      className,
      classNames,
      ...props
    },
    ref,
  ) {
    const [tags, setTags] = useControllableState({
      value,
      defaultValue,
      onChange: onValueChange,
    });
    const [query, setQuery] = useState('');
    const highlighted = useRef<string | undefined>(undefined);
    const full = max !== undefined && tags.length >= max;

    const accept = (current: string[], raw: string): string[] => {
      const tag = raw.trim();
      if (!tag || (max !== undefined && current.length >= max)) return current;
      const lower = tag.toLocaleLowerCase();
      if (current.some((t) => t.toLocaleLowerCase() === lower)) return current;
      const known = suggestions?.find((s) => s.toLocaleLowerCase() === lower);
      if (!known && !allowCustom) return current;
      if (validate && !validate(known ?? tag)) return current;
      return [...current, known ?? tag];
    };

    const commit = (texts: string[]) => {
      const next = texts.reduce(accept, tags);
      if (next !== tags) setTags(next);
      setQuery('');
    };

    const splitPattern = new RegExp(
      `[${delimiters.map((d) => d.replace(/[\\\]^-]/g, '\\$&')).join('')}\\n]`,
    );

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      const isDelimiter = delimiters.includes(event.key);
      if (event.key === 'Enter' && highlighted.current === undefined) {
        if (!query.trim()) return;
        event.preventDefault();
        commit([query]);
      } else if (isDelimiter) {
        event.preventDefault();
        commit([query]);
      }
    };

    const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
      const text = event.clipboardData.getData('text');
      if (!splitPattern.test(text)) return;
      event.preventDefault();
      commit((query + text).split(splitPattern));
    };

    const trimmed = query.trim();
    const lowered = trimmed.toLocaleLowerCase();
    const exact = suggestions?.some((s) => s.toLocaleLowerCase() === lowered);
    const items =
      suggestions && trimmed && allowCustom && !exact
        ? [...suggestions, trimmed]
        : (suggestions ?? []);

    return (
      <BaseCombobox.Root
        items={items}
        multiple
        value={tags}
        onValueChange={(next: string[]) => {
          const added = next.filter((t) => !tags.includes(t));
          const kept = next.filter((t) => tags.includes(t));
          setTags(added.reduce(accept, kept));
          setQuery('');
        }}
        inputValue={query}
        onInputValueChange={setQuery}
        onItemHighlighted={(item: string | undefined) => {
          highlighted.current = item;
        }}
        name={name}
        disabled={disabled}
      >
        <BaseCombobox.InputGroup
          ref={ref}
          data-slot="tag-input"
          className={cn(
            inputVariants({ size }),
            'flex h-auto cursor-text flex-wrap items-center gap-1 pe-1.5',
            'focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/25',
            minHeight[size],
            classNames?.root,
            className,
          )}
        >
          <BaseCombobox.Chips
            className="contents"
            aria-label={tags.length > 0 ? props['aria-label'] : undefined}
          >
            {tags.map((tag) => (
              <BaseCombobox.Chip
                key={tag}
                data-slot="tag-input-tag"
                aria-label={tag}
                className={cn(
                  'inline-flex h-6 max-w-full items-center gap-1 rounded-sm bg-secondary ps-2 pe-0.5 text-xs font-medium text-secondary-foreground outline-none',
                  'focus-visible:ring-2 focus-visible:ring-ring data-highlighted:ring-2 data-highlighted:ring-ring',
                  classNames?.tag,
                )}
              >
                <span className="truncate">{tag}</span>
                <BaseCombobox.ChipRemove
                  data-slot="tag-input-tag-remove"
                  aria-label={removeLabel(tag)}
                  className={cn(
                    'flex size-5 cursor-pointer items-center justify-center rounded-sm text-muted-foreground hover:bg-background hover:text-foreground',
                    classNames?.tagRemove,
                  )}
                >
                  <XIcon className="size-3" />
                </BaseCombobox.ChipRemove>
              </BaseCombobox.Chip>
            ))}
            <BaseCombobox.Input
              id={id}
              data-slot="tag-input-input"
              aria-label={props['aria-label']}
              placeholder={tags.length === 0 ? placeholder : undefined}
              disabled={disabled || full}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              className={cn(
                'h-6 min-w-16 flex-1 border-0 bg-transparent px-1 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed',
                classNames?.input,
              )}
            />
          </BaseCombobox.Chips>
        </BaseCombobox.InputGroup>
        {suggestions && (
          <BaseCombobox.Portal>
            <BaseCombobox.Positioner
              className="z-50 outline-none"
              sideOffset={4}
              align="start"
            >
              <BaseCombobox.Popup
                data-slot="tag-input-popup"
                className={cn(
                  popupSurface,
                  'max-h-[min(var(--available-height),18rem)] w-(--anchor-width) overflow-y-auto p-1 empty:hidden',
                  classNames?.popup,
                )}
              >
                <BaseCombobox.List className="outline-none data-empty:p-0">
                  {(item: string) => (
                    <BaseCombobox.Item
                      key={item}
                      value={item}
                      data-slot="tag-input-item"
                      className={cn(
                        listItem,
                        'cursor-pointer pe-8',
                        classNames?.item,
                      )}
                    >
                      {item === trimmed && !exact ? (
                        <>
                          <PlusIcon />
                          {addLabel(item)}
                        </>
                      ) : (
                        item
                      )}
                      <BaseCombobox.ItemIndicator className="absolute end-2 flex items-center">
                        <CheckIcon className="size-4" />
                      </BaseCombobox.ItemIndicator>
                    </BaseCombobox.Item>
                  )}
                </BaseCombobox.List>
              </BaseCombobox.Popup>
            </BaseCombobox.Positioner>
          </BaseCombobox.Portal>
        )}
      </BaseCombobox.Root>
    );
  },
);
