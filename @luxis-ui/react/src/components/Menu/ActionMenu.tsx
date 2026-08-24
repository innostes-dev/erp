"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '../../icons/IconComponents';
import { Flex } from '../Flex';
import { Typography } from '../Typography';
import { MenuItem, MenuItemProps } from './Menu';
import './ActionMenu.css';

export interface ActionMenuProps {
  /**
   * Menu items to display in dropdown
   */
  items: MenuItemProps[];
  /**
   * Trigger element (button, icon, etc.) or render function
   * Can be a React element or a function that receives trigger state
   * @example
   * trigger={<Button>Open Menu</Button>}
   * @example
   * trigger={({ isOpen, toggle }) => <Button onClick={toggle}>Menu {isOpen ? '▲' : '▼'}</Button>}
   */
  trigger?: React.ReactNode | ((props: { isOpen: boolean; toggle: () => void; disabled: boolean }) => React.ReactNode);
  /**
   * Trigger label text (used if trigger is not provided)
   */
  triggerLabel?: string;
  /**
   * Trigger icon (used if trigger is not provided)
   */
  triggerIcon?: React.ReactNode;
  /**
   * Position of the menu relative to trigger
   * @default 'bottom-start'
   */
  position?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
  /**
   * Custom className for the menu
   */
  className?: string;
  /**
   * Custom className for the trigger
   */
  triggerClassName?: string;
  /**
   * Whether the menu is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Callback when menu opens
   */
  onOpen?: () => void;
  /**
   * Callback when menu closes
   */
  onClose?: () => void;
}

// Chevron icon for trigger (down when closed, up when open)
const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
  isOpen ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />
);

/**
 * ActionMenu component - Dropdown menu triggered by a button click
 *
 * A dropdown menu that opens below a trigger element. Perfect for actions menus,
 * context menus, and dropdown options.
 *
 * @example
 * Basic usage
 * ```tsx
 * <ActionMenu
 *   triggerLabel="Actions"
 *   items={[
 *     { label: 'Edit', icon: <EditIcon />, onClick: () => {} },
 *     { label: 'Delete', icon: <DeleteIcon />, onClick: () => {}, variant: 'danger' }
 *   ]}
 * />
 * ```
 *
 * @example
 * Custom trigger element
 * ```tsx
 * <ActionMenu
 *   trigger={<Button>Open Menu</Button>}
 *   items={menuItems}
 * />
 * ```
 *
 * @example
 * Custom trigger with render function (full control)
 * ```tsx
 * <ActionMenu
 *   trigger={({ isOpen, toggle, disabled }) => (
 *     <Button onClick={toggle} disabled={disabled}>
 *       Menu {isOpen ? '▲' : '▼'}
 *     </Button>
 *   )}
 *   items={menuItems}
 * />
 * ```
 *
 * @example
 * With icon
 * ```tsx
 * <ActionMenu
 *   triggerLabel="More"
 *   triggerIcon={<MoreVerticalIcon />}
 *   position="bottom-end"
 *   items={[
 *     { label: 'Share', icon: <ShareIcon /> },
 *     { label: 'Download', icon: <DownloadIcon /> }
 *   ]}
 * />
 * ```
 */
const ActionMenu = React.forwardRef<HTMLDivElement, ActionMenuProps>(
  (
    {
      items,
      trigger,
      triggerLabel = 'Actions',
      triggerIcon,
      position = 'bottom-start',
      className = '',
      triggerClassName = '',
      disabled = false,
      onOpen,
      onClose,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Toggle menu open/close
    const toggleMenu = () => {
      if (disabled) return;
      const newState = !isOpen;
      setIsOpen(newState);
      if (newState && onOpen) {
        onOpen();
      } else if (!newState && onClose) {
        onClose();
      }
    };

    // Close menu on outside click
    useEffect(() => {
      if (!isOpen) return;

      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
          onClose?.();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    // Close menu on Escape key
    useEffect(() => {
      if (!isOpen) return;

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setIsOpen(false);
          onClose?.();
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Wrap item onClick to close menu after action
    const wrappedItems = items.map((item) => ({
      ...item,
      onClick: item.onClick
        ? () => {
            item.onClick?.();
            setIsOpen(false);
            onClose?.();
          }
        : undefined,
    }));

    const positionClass = `lxs-action-menu--${position}`;

    // Render trigger - supports both ReactNode and render function
    const renderTriggerContent = () => {
      if (typeof trigger === 'function') {
        return trigger({ isOpen, toggle: toggleMenu, disabled });
      }
      
      if (trigger) {
        return trigger;
      }

      // Default trigger
      return (
        <Flex align="center" gap={8}>
          {triggerIcon && <span className="lxs-action-menu-trigger-icon">{triggerIcon}</span>}
          <Typography variant="body2" noMargin>
            {triggerLabel}
          </Typography>
          <ChevronIcon isOpen={isOpen} />
        </Flex>
      );
    };

    // If trigger is a function, render it without wrapper
    const triggerContent = renderTriggerContent();
    const isCustomTrigger = typeof trigger === 'function' || React.isValidElement(trigger);

    return (
      <div ref={containerRef} className="lxs-action-menu-container">
        {isCustomTrigger ? (
          <div className="lxs-action-menu-trigger-wrapper">
            {typeof trigger === 'function' ? (
              triggerContent
            ) : (
              <div onClick={toggleMenu}>{triggerContent}</div>
            )}
          </div>
        ) : (
          <div
            className={[
              'lxs-action-menu-trigger',
              disabled && 'lxs-action-menu-trigger--disabled',
              isOpen && 'lxs-action-menu-trigger--open',
              triggerClassName,
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={toggleMenu}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleMenu();
              }
            }}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-haspopup="menu"
            aria-expanded={isOpen}
            aria-disabled={disabled}
          >
            {triggerContent}
          </div>
        )}
        {isOpen && (
          <div
            ref={ref || menuRef}
            className={['lxs-action-menu', positionClass, className].filter(Boolean).join(' ')}
            role="menu"
          >
            {wrappedItems.map((item, index) => (
              <MenuItem key={index} {...item} />
            ))}
          </div>
        )}
      </div>
    );
  }
);

ActionMenu.displayName = 'ActionMenu';

export default ActionMenu as React.FC<ActionMenuProps & React.RefAttributes<HTMLDivElement>>;
export { ActionMenu };
