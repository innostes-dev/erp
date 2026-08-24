"use client";

import React, { Children, isValidElement, useCallback, useState } from "react";
import AccordionItem from "./AccordionItem";
import { Skeleton } from "../Skeleton";
import { AccordionProps, AccordionItemProps } from "./types";
import { useThemeContext } from '../../theme';
import './Accordion.css';
/**
 * Accordion component - Collapsible content panels for presenting information in a limited space.
 *
 * @example
 * Basic usage with items prop:
 * ```tsx
 * <Accordion
 *   items={[
 *     { id: 'item1', header: 'Section 1', children: <div>Content 1</div> },
 *     { id: 'item2', header: 'Section 2', children: <div>Content 2</div> },
 *   ]}
 * />
 * ```
 *
 * @example
 * Usage with AccordionItem children:
 * ```tsx
 * <Accordion>
 *   <AccordionItem id="item1" header="Section 1">Content 1</AccordionItem>
 *   <AccordionItem id="item2" header="Section 2">Content 2</AccordionItem>
 * </Accordion>
 * ```
 */
const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  (
    {
      items,
      children,
      allowMultiple = false,
      defaultOpenItems = [],
      openItems,
      onToggle,
      variant = 'default',
      size,
      className = '',
      style,
      showChevron = true,
      chevronPosition = 'right',
      expandedIcon,
      collapsedIcon,
      iconType = 'chevron',
      showDivider = true,
      collapsible = true,
      loading = false,
      disabled = false,
      spacing = 'default',
      disableAnimations = false,
      ...props
    },
    ref
  ) => {
    const { theme } = useThemeContext();
    const accordionSize = size ?? theme.global.size;

    // Handle both controlled and uncontrolled modes
    const [internalOpenItems, setInternalOpenItems] = useState<string[]>(defaultOpenItems);
    const isControlled = openItems !== undefined;
    const currentOpenItems = isControlled ? openItems : internalOpenItems;

    // Convert children to items if children are provided
    const accordionItems: AccordionItemProps[] =
      items ||
      Children.toArray(children)
        .filter((child) => isValidElement(child))
        .map((child, index) => {
          if (isValidElement(child) && child.props) {
            const el = child as React.ReactElement<any>;
            return {
              id: el.props.id || `accordion-item-${index}`,
              header: el.props.header || `Item ${index + 1}`,
              children: el.props.children,
              disabled: el.props.disabled,
              className: el.props.className,
            };
          }
          return {
            id: `accordion-item-${index}`,
            header: `Item ${index + 1}`,
            children: child,
          };
        });

    const handleItemToggle = useCallback(
      (itemId: string) => {
        let newOpenItems: string[];

        if (allowMultiple) {
          // Multiple items can be open
          if (currentOpenItems.includes(itemId)) {
            // Close the item
            newOpenItems = currentOpenItems.filter((id) => id !== itemId);
          } else {
            // Open the item
            newOpenItems = [...currentOpenItems, itemId];
          }
        } else {
          // Only one item can be open at a time
          const alreadyOpen = currentOpenItems.includes(itemId);
          if (alreadyOpen) {
            newOpenItems = collapsible ? [] : currentOpenItems;
          } else {
            newOpenItems = [itemId];
          }
        }

        if (!isControlled) {
          setInternalOpenItems(newOpenItems);
        }
        onToggle?.(newOpenItems);
      },
      [allowMultiple, collapsible, currentOpenItems, isControlled, onToggle]
    );

    const skeletonCount = accordionItems.length || 3;
    const skeletonPaddingMap = { sm: '12px 16px', md: '16px 20px', lg: '20px 24px' };
    const skeletonHeightMap = { sm: 14, md: 16, lg: 20 };
    const skeletonPadding = skeletonPaddingMap[accordionSize];
    const skeletonHeight = skeletonHeightMap[accordionSize];
    const skeletonKeys = Array.from({ length: skeletonCount }, (_, i) => `skeleton-item-${i}`);

    return (
      <div
        ref={ref}
        className={`
          accordion
          accordion--${variant}
          accordion--${accordionSize}
          ${showDivider ? 'accordion--divider' : ''}
          ${spacing === 'compact' ? 'accordion--compact' : ''}
          ${spacing === 'spacious' ? 'accordion--spacious' : ''}
          ${disableAnimations ? 'accordion--no-animation' : ''}
          ${loading ? 'accordion--loading' : ''}
          ${disabled ? 'accordion--disabled' : ''}
          ${className}
        `.trim()}
        style={style}
        aria-busy={loading}
        {...props}
      >
        {loading
          ? skeletonKeys.map((key) => (
              <div key={key} className="accordion-item accordion-item--skeleton" style={{ padding: skeletonPadding, display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                <Skeleton variant="text" width="100%" height={skeletonHeight} animation="wave" style={{ flex: 1 }} />
                <Skeleton variant="circular" width={skeletonHeight + 4} height={skeletonHeight + 4} animation="wave" style={{ flexShrink: 0 }} />
              </div>
            ))
          : accordionItems.map((item) => (
              <AccordionItem
                key={item.id}
                item={item}
                isOpen={currentOpenItems.includes(item.id)}
                onToggle={() => handleItemToggle(item.id)}
                variant={variant}
                size={accordionSize}
                showChevron={showChevron}
                chevronPosition={chevronPosition}
                expandedIcon={expandedIcon}
                collapsedIcon={collapsedIcon}
                iconType={iconType}
                loading={loading}
                disabled={disabled}
                spacing={spacing}
                disableAnimations={disableAnimations}
              />
            ))}
      </div>
    );
  }
);

Accordion.displayName = 'Accordion';

export default Accordion as React.FC<
  AccordionProps & React.RefAttributes<HTMLDivElement>
>;
export { Accordion };
export type { AccordionProps } from './types';
