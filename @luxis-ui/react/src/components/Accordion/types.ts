import { ReactNode } from 'react';

export interface AccordionItemProps {
  /** Unique identifier for the accordion item */
  id: string;
  /** The header content for the accordion item */
  header: ReactNode;
  /** The body content for the accordion item */
  children: ReactNode;
  /** Whether this item is disabled */
  disabled?: boolean;
  /** Custom class name for the accordion item */
  className?: string;
  /** Loading state for this specific item */
  loading?: boolean;
  /** Status indicator for the item */
  status?: 'default' | 'success' | 'warning' | 'error' | 'featured';
  /** Custom icon for this specific item (overrides accordion-level icons) */
  icon?: {
    expanded?: React.ReactNode;
    collapsed?: React.ReactNode;
  };
  /** Additional data attributes for testing or analytics */
  dataTestId?: string;
}

export interface AccordionProps {
  /** Array of accordion items */
  items?: AccordionItemProps[];
  /** Children accordion items (alternative to items prop) */
  children?: ReactNode;
  /** Whether multiple items can be open at once */
  allowMultiple?: boolean;
  /** Default open items (controlled) */
  defaultOpenItems?: string[];
  /** Open items (uncontrolled) */
  openItems?: string[];
  /** Callback when items are toggled */
  onToggle?: (openItems: string[]) => void;
  /** Visual variant style of the accordion */
  variant?: 'default' | 'bordered' | 'separated' | 'flush';
  /** Size variant of the accordion */
  size?: 'sm' | 'md' | 'lg';
  /** Custom class name */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
  /** Whether to show chevron icons */
  showChevron?: boolean;
  /** Position of the chevron icon */
  chevronPosition?: 'left' | 'right';
  /** Custom icon for expanded state */
  expandedIcon?: React.ReactNode;
  /** Custom icon for collapsed state */
  collapsedIcon?: React.ReactNode;
  /** Icon type preset */
  iconType?: 'chevron' | 'plus-minus' | 'custom';
  /** Whether to show divider lines between items */
  showDivider?: boolean;
  /** Whether items are collapsible (can all be closed) */
  collapsible?: boolean;
  /** Loading state for the entire accordion */
  loading?: boolean;
  /** Disable all accordion interactions */
  disabled?: boolean;
  /** Spacing variant for compact or spacious layouts */
  spacing?: 'compact' | 'default' | 'spacious';
  /** Disable animations for better performance or accessibility */
  disableAnimations?: boolean;
}

export interface AccordionItemComponentProps {
  /** The accordion item data */
  item: AccordionItemProps;
  /** Whether this item is open */
  isOpen: boolean;
  /** Function to toggle this item */
  onToggle: () => void;
  /** Variant from parent accordion */
  variant: AccordionProps['variant'];
  /** Size from parent accordion */
  size: AccordionProps['size'];
  /** Whether to show chevron */
  showChevron: boolean;
  /** Chevron position */
  chevronPosition: AccordionProps['chevronPosition'];
  /** Custom icon for expanded state */
  expandedIcon?: React.ReactNode;
  /** Custom icon for collapsed state */
  collapsedIcon?: React.ReactNode;
  /** Icon type preset */
  iconType?: AccordionProps['iconType'];
  /** Loading state from parent accordion */
  loading?: boolean;
  /** Disabled state from parent accordion */
  disabled?: boolean;
  /** Spacing variant from parent accordion */
  spacing?: AccordionProps['spacing'];
  /** Disable animations */
  disableAnimations?: boolean;
}
