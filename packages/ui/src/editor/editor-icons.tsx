import { forwardRef, type SVGProps } from 'react';

/**
 * Toolbar icons for the rich text editor, in the Lucide style of `lib/icons`. Kept here so
 * the main entry doesn't carry them.
 *
 * @internal
 */
export type IconProps = SVGProps<SVGSVGElement>;

const Icon = forwardRef<SVGSVGElement, IconProps & { 'data-slot'?: string }>(
  function Icon({ children, 'data-slot': dataSlot = 'editor-icon', ...props }, ref) {
    return (
      <svg
        ref={ref}
        data-slot={dataSlot}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
        {...props}
      >
        {children}
      </svg>
    );
  },
);

export const BoldIcon = forwardRef<SVGSVGElement, IconProps>(function BoldIcon(props, ref) {
  return (
    <Icon ref={ref} data-slot="editor-icon-bold" {...props}>
      <path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8" />
    </Icon>
  );
});

export const ItalicIcon = forwardRef<SVGSVGElement, IconProps>(function ItalicIcon(props, ref) {
  return (
    <Icon ref={ref} data-slot="editor-icon-italic" {...props}>
      <path d="M19 4h-9" />
      <path d="M14 20H5" />
      <path d="M15 4 9 20" />
    </Icon>
  );
});

export const UnderlineIcon = forwardRef<SVGSVGElement, IconProps>(function UnderlineIcon(props, ref) {
  return (
    <Icon ref={ref} data-slot="editor-icon-underline" {...props}>
      <path d="M6 4v6a6 6 0 0 0 12 0V4" />
      <path d="M4 20h16" />
    </Icon>
  );
});

export const StrikethroughIcon = forwardRef<SVGSVGElement, IconProps>(function StrikethroughIcon(props, ref) {
  return (
    <Icon ref={ref} data-slot="editor-icon-strikethrough" {...props}>
      <path d="M16 4H9a3 3 0 0 0-2.83 4" />
      <path d="M14 12a4 4 0 0 1 0 8H6" />
      <path d="M4 12h16" />
    </Icon>
  );
});

export const HeadingIcon = forwardRef<SVGSVGElement, IconProps>(function HeadingIcon(props, ref) {
  return (
    <Icon ref={ref} data-slot="editor-icon-heading" {...props}>
      <path d="M4 12h8" />
      <path d="M4 18V6" />
      <path d="M12 18V6" />
      <path d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1" />
    </Icon>
  );
});

export const ListIcon = forwardRef<SVGSVGElement, IconProps>(function ListIcon(props, ref) {
  return (
    <Icon ref={ref} data-slot="editor-icon-list" {...props}>
      <path d="M3 6h.01" />
      <path d="M3 12h.01" />
      <path d="M3 18h.01" />
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
    </Icon>
  );
});

export const ListOrderedIcon = forwardRef<SVGSVGElement, IconProps>(function ListOrderedIcon(props, ref) {
  return (
    <Icon ref={ref} data-slot="editor-icon-list-ordered" {...props}>
      <path d="M10 6h11" />
      <path d="M10 12h11" />
      <path d="M10 18h11" />
      <path d="M4 6h1v4" />
      <path d="M4 10h2" />
      <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
    </Icon>
  );
});

export const QuoteIcon = forwardRef<SVGSVGElement, IconProps>(function QuoteIcon(props, ref) {
  return (
    <Icon ref={ref} data-slot="editor-icon-quote" {...props}>
      <path d="M17 6H3" />
      <path d="M21 12H8" />
      <path d="M21 18H8" />
      <path d="M3 12v6" />
    </Icon>
  );
});

export const CodeIcon = forwardRef<SVGSVGElement, IconProps>(function CodeIcon(props, ref) {
  return (
    <Icon ref={ref} data-slot="editor-icon-code" {...props}>
      <path d="m16 18 6-6-6-6" />
      <path d="m8 6-6 6 6 6" />
    </Icon>
  );
});

export const LinkIcon = forwardRef<SVGSVGElement, IconProps>(function LinkIcon(props, ref) {
  return (
    <Icon ref={ref} data-slot="editor-icon-link" {...props}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </Icon>
  );
});

export const UndoIcon = forwardRef<SVGSVGElement, IconProps>(function UndoIcon(props, ref) {
  return (
    <Icon ref={ref} data-slot="editor-icon-undo" {...props}>
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </Icon>
  );
});

export const RedoIcon = forwardRef<SVGSVGElement, IconProps>(function RedoIcon(props, ref) {
  return (
    <Icon ref={ref} data-slot="editor-icon-redo" {...props}>
      <path d="m15 14 5-5-5-5" />
      <path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />
    </Icon>
  );
});
