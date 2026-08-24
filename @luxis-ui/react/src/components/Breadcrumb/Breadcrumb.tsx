"use client";

import React, { useContext } from 'react';
import { ThemeContext } from '../../theme/ThemeProvider';
import { ChevronRightIcon } from '../../icons/IconComponents';
import { Link } from '../Link/Link';
import { Typography } from '../Typography/Typography';
import type { TypographyVariant } from '../Typography/Typography';
import './Breadcrumb.css';

export type BreadcrumbSize = 'sm' | 'md' | 'lg';

export interface BreadcrumbItem {
  /** Label text for the breadcrumb item (optional if using icon-only) */
  label?: string;
  /** URL to navigate to (for native anchor links) */
  href?: string;
  /** Icon displayed before the label */
  icon?: React.ReactNode;
  /**
   * If true, this item is the current / active page
   * @default false
   */
  active?: boolean;
  /**
   * Disable this item without marking it as the current page.
   * Prevents navigation and renders it visually dimmed.
   * @default false
   */
  disabled?: boolean;
  /** Extra class applied to the item's &lt;li&gt; element */
  className?: string;
  /**
   * Accessible label for the item — required for icon-only items.
   * Falls back to the visible `label` text.
   */
  ariaLabel?: string;
  /**
   * Props forwarded to the custom link component.
   * Examples: `{ to: '/page' }` (React Router), `{ prefetch: false }` (Next.js)
   */
  linkProps?: Record<string, unknown>;
}

export interface BreadcrumbProps {
  /**
   * Array of breadcrumb items
   */
  items: BreadcrumbItem[];
  /**
   * Custom separator between items
   * @default <ChevronRightIcon />
   */
  separator?: React.ReactNode;
  /**
   * Custom Link component to use (e.g., Next.js Link or React Router Link)
   * @example
   * import { Link as RouterLink } from 'react-router-dom'
   * <Breadcrumb linkComponent={RouterLink} items={items} />
   */
  linkComponent?: React.ElementType;
  /**
   * Maximum number of items to show before collapsing
   * Shows first, ..., and last items
   */
  maxItems?: number;
  /**
   * Size variant
   * @default 'md'
   */
  size?: BreadcrumbSize;
  /**
   * Custom className
   */
  className?: string;
  /**
   * Custom separator className
   */
  separatorClassName?: string;
  /**
   * Override the `<nav>` element's accessible label
   * @default 'Breadcrumb'
   */
  ariaLabel?: string;
  /**
   * Color applied to all navigable link items
   * @default 'inherit'
   */
  linkColor?: 'primary' | 'secondary' | 'neutral' | 'inherit';
  /**
   * Extra class applied to every item's `<li>`
   */
  itemClassName?: string;
  /**
   * Extra class applied only to the active item's `<li>`
   */
  activeItemClassName?: string;
  /**
   * Inline style for the root `<nav>` element
   */
  style?: React.CSSProperties;
}

/**
 * Breadcrumb component - Navigation aid showing current location hierarchy
 *
 * A flexible breadcrumb component that works with native anchors, React Router, Next.js,
 * or any custom routing library. Supports icons, custom separators, and collapsing.
 *
 * @example
 * Basic usage
 * ```tsx
 * <Breadcrumb
 *   items={[
 *     { label: 'Home', href: '/' },
 *     { label: 'Products', href: '/products' },
 *     { label: 'Electronics', href: '/products/electronics' },
 *     { label: 'Laptops', active: true }
 *   ]}
 * />
 * ```
 *
 * @example
 * With React Router
 * ```tsx
 * import { Link as RouterLink } from 'react-router-dom'
 * 
 * <Breadcrumb
 *   linkComponent={RouterLink}
 *   items={[
 *     { label: 'Home', linkProps: { to: '/' } },
 *     { label: 'Dashboard', linkProps: { to: '/dashboard' }, active: true }
 *   ]}
 * />
 * ```
 *
 * @example
 * With Next.js
 * ```tsx
 * import NextLink from 'next/link'
 * 
 * <Breadcrumb
 *   linkComponent={NextLink}
 *   items={[
 *     { label: 'Home', linkProps: { href: '/' } },
 *     { label: 'About', linkProps: { href: '/about' }, active: true }
 *   ]}
 * />
 * ```
 *
 * @example
 * With icons and custom separator
 * ```tsx
 * <Breadcrumb
 *   separator="›"
 *   items={[
 *     { label: 'Home', href: '/', icon: <HomeIcon /> },
 *     { label: 'Products', href: '/products', icon: <PackageIcon /> },
 *     { label: 'Current', active: true }
 *   ]}
 * />
 * ```
 *
 * @example
 * With maxItems (collapsing)
 * ```tsx
 * <Breadcrumb
 *   maxItems={4}
 *   items={longItemsList}
 * />
 * ```
 */
/** Maps size variant → Typography text variant for automatic font scaling */
const TEXT_VARIANT_MAP: Record<BreadcrumbSize, TypographyVariant> = {
  sm: 'caption',
  md: 'body2',
  lg: 'body1',
};

/** @internal — private marker for the collapsed ellipsis placeholder item */
interface InternalItem extends BreadcrumbItem {
  _isEllipsis?: boolean;
}

const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  (
    {
      items,
      separator = <ChevronRightIcon size={16} />,
      linkComponent,
      maxItems,
      size,
      ariaLabel = 'Breadcrumb',
      linkColor = 'inherit',
      itemClassName = '',
      activeItemClassName = '',
      className = '',
      separatorClassName = '',
      style,
    },
    ref
  ) => {
    // useContext returns undefined when no ThemeProvider wraps the tree — no throw.
    const themeCtx = useContext(ThemeContext);
    const resolvedSize: BreadcrumbSize =
      size ?? ((themeCtx?.theme.global.size as BreadcrumbSize) ?? 'md');
    const textVariant = TEXT_VARIANT_MAP[resolvedSize];

    // Desktop: collapse via maxItems when set
    const displayItems = React.useMemo<InternalItem[]>(() => {
      if (!maxItems || items.length <= maxItems) return items as InternalItem[];
      const lastItems = items.slice(-(maxItems - 2));
      return [
        items[0],
        { label: '…', _isEllipsis: true },
        ...lastItems,
      ] as InternalItem[];
    }, [items, maxItems]);

    // Mobile: always first / … / last when list is longer than 2
    const mobileDisplayItems = React.useMemo<InternalItem[]>(() => {
      if (items.length <= 2) return items as InternalItem[];
      return [
        items[0],
        { label: '…', _isEllipsis: true },
        items[items.length - 1],
      ] as InternalItem[];
    }, [items]);

    const rootClassNames = [
      'lxs-breadcrumb',
      `lxs-breadcrumb--${resolvedSize}`,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const separatorClassNames = [
      'lxs-breadcrumb-separator',
      separatorClassName,
    ]
      .filter(Boolean)
      .join(' ');

    // isLastItem is passed explicitly so the same function works correctly for
    // both the desktop list and the mobile list (different lengths).
    const renderItem = (item: InternalItem, index: number, isLastItem: boolean) => {
      const isActive = item.active || isLastItem;
      const isEllipsis = item._isEllipsis ?? false;

      const liClassNames = [
        'lxs-breadcrumb-item',
        isActive && 'lxs-breadcrumb-item--active',
        isActive && activeItemClassName,
        isEllipsis && 'lxs-breadcrumb-item--ellipsis',
        item.disabled && 'lxs-breadcrumb-item--disabled',
        itemClassName,
        item.className,
      ]
        .filter(Boolean)
        .join(' ');

      const labelContent = (
        <>
          {item.icon && <span className="lxs-breadcrumb-item-icon">{item.icon}</span>}
          {item.label && (
            <Typography as="span" variant={textVariant} noMargin className="lxs-breadcrumb-item-label">
              {item.label}
            </Typography>
          )}
        </>
      );

      // Ellipsis pseudo-item — hidden from AT (purely visual placeholder)
      if (isEllipsis) {
        return (
          <li key={index} className={liClassNames} aria-hidden="true">
            <span className="lxs-breadcrumb-item-content">…</span>
          </li>
        );
      }

      // Current / active page
      if (isActive) {
        return (
          <li key={index} className={liClassNames} aria-current="page">
            <span className="lxs-breadcrumb-item-content" aria-label={item.ariaLabel}>
              {labelContent}
            </span>
          </li>
        );
      }

      // Navigable item
      const hasLink = item.href || item.linkProps;
      if (hasLink) {
        return (
          <li key={index} className={liClassNames}>
            <Link
              href={item.href}
              component={linkComponent}
              componentProps={item.linkProps}
              className="lxs-breadcrumb-item-link"
              color={linkColor}
              disabled={item.disabled}
              aria-label={item.ariaLabel}
            >
              {labelContent}
            </Link>
          </li>
        );
      }

      // Non-navigable, non-active item
      return (
        <li key={index} className={liClassNames}>
          <span className="lxs-breadcrumb-item-content" aria-label={item.ariaLabel}>
            {labelContent}
          </span>
        </li>
      );
    };

    const renderList = (
      listItems: InternalItem[],
      listClassName: string,
      ariaHiddenProp?: boolean
    ) => (
      <ol
        className={`lxs-breadcrumb-list ${listClassName}`}
        aria-hidden={ariaHiddenProp ? 'true' : undefined}
      >
        {listItems.map((item, index) => {
          const isLastItem = index === listItems.length - 1;
          return (
            <React.Fragment key={`${item.href ?? item.label ?? index}-${index}`}>
              {renderItem(item, index, isLastItem)}
              {!isLastItem && (
                <li className={separatorClassNames} aria-hidden="true">
                  {separator}
                </li>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    );

    return (
      <nav ref={ref} className={rootClassNames} aria-label={ariaLabel} style={style}>
        {/* Desktop — full or maxItems-collapsed list */}
        {renderList(displayItems, 'lxs-breadcrumb-list--desktop')}
        {/* Mobile — always first/…/last; aria-hidden so AT reads only one list */}
        {renderList(mobileDisplayItems, 'lxs-breadcrumb-list--mobile', true)}
      </nav>
    );
  }
);

Breadcrumb.displayName = 'Breadcrumb';

export { Breadcrumb };
export default Breadcrumb;
