"use client";

import { CloseSmallIcon } from '../../icons/IconComponents';
import React, { useState, useRef, useEffect, useCallback, useId, cloneElement, HTMLAttributes } from 'react';
import { createPortal } from 'react-dom';
import './Tooltip.css';

export type TooltipPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'right'
  | 'right-start'
  | 'right-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end';

export interface TooltipProps extends Omit<HTMLAttributes<HTMLDivElement>, 'content'> {
  /**
   * Content to display in the tooltip
   * Can be text, JSX, or any React node
   */
  content: React.ReactNode;
  /**
   * Placement of the tooltip relative to the trigger element
   * @default 'top'
   */
  placement?: TooltipPlacement;
  /**
   * Delay before showing tooltip in milliseconds
   * @default 200
   */
  delay?: number;
  /**
   * Delay before hiding tooltip in milliseconds
   * @default 0
   */
  hideDelay?: number;
  /**
   * Element that triggers the tooltip
   */
  children: React.ReactElement<Record<string, unknown>>;
  /**
   * If true, tooltip is always visible
   * @default false
   */
  open?: boolean;
  /**
   * If true, tooltip is disabled and won't show
   * @default false
   */
  disabled?: boolean;
  /**
   * If true, shows an arrow pointing to the trigger element
   * @default false
   */
  arrow?: boolean;
  /**
   * Maximum width of the tooltip
   * @default '300px'
   */
  maxWidth?: string;
  /**
   * Tooltip variant for different visual styles
   * @default 'dark'
   */
  variant?: 'dark' | 'light' | 'error' | 'warning' | 'success' | 'info';
  /**
   * If true, shows a close button to manually dismiss the tooltip
   * @default false
   */
  dismissible?: boolean;
  /**
   * Callback fired when tooltip is shown
   */
  onShow?: () => void;
  /**
   * Callback fired when tooltip is hidden
   */
  onHide?: () => void;
  /**
   * Callback fired when dismiss button is clicked
   */
  onDismiss?: () => void;
}

/**
 * Calculate the anchor position for the tooltip based on the trigger's bounding rect.
 * CSS transforms handle the rest (centering, offset animations).
 * Uses viewport coordinates only (no scroll offsets) since the tooltip is `position: fixed`.
 */
function getHorizontalPos(rect: DOMRect, align: string | undefined): number {
  if (align === 'start') return rect.left;
  if (align === 'end') return rect.right;
  return rect.left + rect.width / 2;
}

function getVerticalPos(rect: DOMRect, align: string | undefined): number {
  if (align === 'start') return rect.top;
  if (align === 'end') return rect.bottom;
  return rect.top + rect.height / 2;
}

function getAnchorPosition(
  rect: DOMRect,
  placementValue: TooltipPlacement,
  offset: number
): { top: number; left: number } {
  const base = placementValue.split('-')[0];
  const align = placementValue.split('-')[1];

  switch (base) {
    case 'top':
      return { top: rect.top - offset, left: getHorizontalPos(rect, align) };
    case 'bottom':
      return { top: rect.bottom + offset, left: getHorizontalPos(rect, align) };
    case 'left':
      return { top: getVerticalPos(rect, align), left: rect.left - offset };
    case 'right':
      return { top: getVerticalPos(rect, align), left: rect.right + offset };
    default:
      return { top: rect.top - offset, left: getHorizontalPos(rect, align) };
  }
}

const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  (
    {
      content,
      placement = 'top',
      delay = 200,
      hideDelay = 0,
      children,
      open,
      disabled = false,
      arrow = false,
      maxWidth = '300px',
      variant = 'dark',
      dismissible = false,
      onShow,
      onHide,
      onDismiss,
      className = '',
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    const triggerRef = useRef<HTMLElement | null>(null);
    const showTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const unmountTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isHoveringRef = useRef(false);

    // Use refs for values needed inside timeouts to avoid stale closures
    const placementRef = useRef(placement);
    placementRef.current = placement;
    const arrowRef = useRef(arrow);
    arrowRef.current = arrow;

    const tooltipId = useId();

    const updatePosition = useCallback(() => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const offset = arrowRef.current ? 12 : 8;
      setPosition(getAnchorPosition(rect, placementRef.current, offset));
    }, []);

    const clearAllTimeouts = useCallback(() => {
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      if (unmountTimeoutRef.current) clearTimeout(unmountTimeoutRef.current);
    }, []);

    const doShow = useCallback(() => {
      updatePosition();
      setIsMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
          onShow?.();
        });
      });
    }, [updatePosition, onShow]);

    const doHide = useCallback(() => {
      setIsVisible(false);
      onHide?.();
      unmountTimeoutRef.current = setTimeout(() => {
        setIsMounted(false);
      }, 150);
    }, [onHide]);

    const showTooltip = useCallback(() => {
      if (disabled) return;
      isHoveringRef.current = true;

      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      if (unmountTimeoutRef.current) clearTimeout(unmountTimeoutRef.current);

      showTimeoutRef.current = setTimeout(() => {
        if (triggerRef.current && isHoveringRef.current) {
          doShow();
        }
      }, delay);
    }, [disabled, delay, doShow]);

    const hideTooltip = useCallback(() => {
      isHoveringRef.current = false;
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);

      hideTimeoutRef.current = setTimeout(() => {
        if (!isHoveringRef.current) {
          doHide();
        }
      }, hideDelay);
    }, [hideDelay, doHide]);

    const handleDismiss = useCallback(() => {
      isHoveringRef.current = false;
      setIsVisible(false);
      onDismiss?.();
      onHide?.();
      unmountTimeoutRef.current = setTimeout(() => {
        setIsMounted(false);
      }, 150);
    }, [onDismiss, onHide]);

    const handleTooltipMouseEnter = useCallback(() => {
      if (disabled || open !== undefined) return;
      isHoveringRef.current = true;
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      if (unmountTimeoutRef.current) clearTimeout(unmountTimeoutRef.current);
    }, [disabled, open]);

    const handleTooltipMouseLeave = useCallback(() => {
      if (disabled || open !== undefined) return;
      hideTooltip();
    }, [disabled, open, hideTooltip]);

    // Controlled mode: sync with `open` prop
    useEffect(() => {
      if (open === undefined) return;
      if (open) {
        doShow();
      } else {
        doHide();
      }
    }, [open, doShow, doHide]);

    // Recalculate position when placement or arrow changes while visible
    useEffect(() => {
      if (isVisible) {
        updatePosition();
      }
    }, [placement, arrow, isVisible, updatePosition]);

    // Reposition on scroll / resize while visible
    useEffect(() => {
      if (!isVisible) return;

      const reposition = () => updatePosition();
      window.addEventListener('scroll', reposition, true);
      window.addEventListener('resize', reposition);
      return () => {
        window.removeEventListener('scroll', reposition, true);
        window.removeEventListener('resize', reposition);
      };
    }, [isVisible, updatePosition]);

    // Dismiss on Escape key
    useEffect(() => {
      if (!isVisible) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          isHoveringRef.current = false;
          if (open === undefined) {
            doHide();
          }
          onDismiss?.();
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isVisible, open, doHide, onDismiss]);

    // Cleanup all timeouts on unmount
    useEffect(() => clearAllTimeouts, [clearAllTimeouts]);

    const tooltipClassNames = [
      'lxs-tooltip',
      `lxs-tooltip--${placement}`,
      `lxs-tooltip--${variant}`,
      arrow && 'lxs-tooltip--with-arrow',
      isVisible && 'lxs-tooltip--visible',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const isControlled = open !== undefined;
    const shouldRender = isControlled ? open || isMounted : isMounted;

    const trigger = cloneElement(children, {
      ref: (node: HTMLElement | null) => {
        triggerRef.current = node;
        const childRef = (children as React.ReactElement & { ref?: React.Ref<HTMLElement> }).ref;
        if (typeof childRef === 'function') {
          childRef(node);
        } else if (childRef && typeof childRef === 'object' && 'current' in childRef) {
          (childRef as { current: HTMLElement | null }).current = node;
        }
      },
      onMouseEnter: (e: React.MouseEvent) => {
        if (open === undefined) showTooltip();
        const childOnMouseEnter = (children.props as { onMouseEnter?: (e: React.MouseEvent) => void }).onMouseEnter;
        childOnMouseEnter?.(e);
      },
      onMouseLeave: (e: React.MouseEvent) => {
        if (open === undefined) hideTooltip();
        const childOnMouseLeave = (children.props as { onMouseLeave?: (e: React.MouseEvent) => void }).onMouseLeave;
        childOnMouseLeave?.(e);
      },
      onFocus: (e: React.FocusEvent) => {
        if (open === undefined) showTooltip();
        const childOnFocus = (children.props as { onFocus?: (e: React.FocusEvent) => void }).onFocus;
        childOnFocus?.(e);
      },
      onBlur: (e: React.FocusEvent) => {
        if (open === undefined) hideTooltip();
        const childOnBlur = (children.props as { onBlur?: (e: React.FocusEvent) => void }).onBlur;
        childOnBlur?.(e);
      },
      'aria-describedby': isVisible ? tooltipId : undefined,
    });

    return (
      <>
        {trigger}
        {shouldRender &&
          createPortal(
            <div
              ref={ref}
              id={tooltipId}
              role="tooltip"
              className={tooltipClassNames}
              style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                maxWidth,
              }}
              onMouseEnter={handleTooltipMouseEnter}
              onMouseLeave={handleTooltipMouseLeave}
              {...props}
            >
              {arrow && <span className="lxs-tooltip-arrow" aria-hidden="true" />}
              <div className="lxs-tooltip-inner">
                <span className="lxs-tooltip-content">{content}</span>
                {dismissible && (
                  <button
                    type="button"
                    className="lxs-tooltip-close"
                    onClick={handleDismiss}
                    aria-label="Dismiss tooltip"
                  >
                    <CloseSmallIcon size={14} />
                  </button>
                )}
              </div>
            </div>,
            document.body
          )}
      </>
    );
  }
);

Tooltip.displayName = 'Tooltip';

export default Tooltip;
export { Tooltip };
