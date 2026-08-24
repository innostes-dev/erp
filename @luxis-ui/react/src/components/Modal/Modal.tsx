"use client";

import { CloseIcon } from '../../icons/IconComponents';
import React, { useRef, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap, useEscapeKey, useBodyScrollLock } from '../../hooks';
import { Flex } from '../Flex';
import { Button } from '../Button';
import { Typography } from '../Typography';
import { useThemeContext } from '../../theme/ThemeProvider';
import './Modal.css';

export interface ModalFooterButton {
  /**
   * Button label text
   */
  label: string;
  /**
   * Click handler for the button
   */
  onClick: () => void;
  /**
   * Button variant
   * @default 'secondary'
   */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning';
  /**
   * Button size
   * @default 'medium'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Loading state
   * @default false
   */
  loading?: boolean;
  /**
   * Disabled state
   * @default false
   */
  disabled?: boolean;
}

export interface ModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;
  /**
   * Callback fired when the modal requests to be closed
   * Called on backdrop click, escape key, or close button click
   */
  onClose: () => void;
  /**
   * Modal title displayed in header
   */
  title?: string;
  /**
   * Optional subtitle or description below the title
   */
  description?: string;
  /**
   * Modal content
   */
  children: React.ReactNode;
  /**
   * Optional header content to replace the default title area
   * When provided, title and description are ignored
   */
  header?: React.ReactNode;
  /**
   * Optional footer content (typically action buttons)
   * Can be a ReactNode or an array of button configurations
   */
  footer?: React.ReactNode;
  /**
   * Array of footer buttons to auto-generate footer
   * If provided, footer prop is ignored
   */
  footerButtons?: ModalFooterButton[];
  /** Size of the modal ('sm', 'md', 'lg', 'fullscreen', 'auto'). Defaults to theme defaultSize */
  size?: 'sm' | 'md' | 'lg' | 'fullscreen' | 'auto';
  /**
   * If false, clicking the backdrop won't close the modal
   * @default true
   */
  closeOnBackdropClick?: boolean;
  /**
   * If false, pressing Escape won't close the modal
   * @default true
   */
  closeOnEscape?: boolean;
  /**
   * If false, hides the close button in the header
   * @default true
   */
  showCloseButton?: boolean;
  /**
   * If true, modal backdrop will be transparent
   * @default false
   */
  transparentBackdrop?: boolean;
  /**
   * Custom class name for the modal content
   */
  className?: string;
  /**
   * Custom class name for the modal backdrop
   */
  backdropClassName?: string;
  /**
   * Prevents body scroll when modal is open
   * @default true
   */
  preventScroll?: boolean;
  /**
   * Animation variant for modal entrance
   * @default 'fade'
   */
  animation?: 'fade' | 'slide-up' | 'slide-down' | 'zoom' | 'none';
  /**
   * Callback fired after modal opens (after animation completes)
   */
  onAfterOpen?: () => void;
  /**
   * Callback fired after modal closes (after animation completes)
   */
  onAfterClose?: () => void;
  /**
   * If true, modal will be scrollable inside
   * @default false
   */
  scrollable?: boolean;
  /**
   * If true, centers the modal vertically
   * @default true
   */
  centered?: boolean;
}

/**
 * Modal component - Overlay dialog for focused user interactions
 *
 * A feature-rich modal component with accessibility features including focus trap,
 * body scroll lock, keyboard navigation, and customizable animations.
 *
 * @example
 * Basic confirmation modal with footerButtons array
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 *
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Confirm Action"
 *   description="Are you sure you want to proceed with this action?"
 *   footerButtons={[
 *     { label: 'Cancel', onClick: () => setIsOpen(false), variant: 'outline' },
 *     { label: 'Confirm', onClick: handleConfirm, variant: 'primary' }
 *   ]}
 * >
 *   <p>This action cannot be undone.</p>
 * </Modal>
 * ```
 *
 * @example
 * Custom footer with ReactNode
 * ```tsx
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Custom Footer"
 *   footer={
 *     <>
 *       <Button onClick={() => setIsOpen(false)}>Cancel</Button>
 *       <Button variant="primary">Save</Button>
 *     </>
 *   }
 * >
 *   <p>Custom content here.</p>
 * </Modal>
 * ```
 *
 * @example
 * Form modal with custom header
 * ```tsx
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   size="large"
 *   header={<CustomHeader />}
 *   scrollable
 * >
 *   <FormContent />
 * </Modal>
 * ```
 *
 * @example
 * Fullscreen modal without backdrop close
 * ```tsx
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   size="fullscreen"
 *   closeOnBackdropClick={false}
 *   animation="slide-up"
 * >
 *   <FullscreenContent />
 * </Modal>
 * ```
 */
const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      isOpen,
      onClose,
      title,
      description,
      children,
      header,
      footer,
      footerButtons,
      size,
      closeOnBackdropClick = true,
      closeOnEscape = true,
      showCloseButton = true,
      transparentBackdrop = false,
      className = '',
      backdropClassName = '',
      preventScroll = true,
      animation = 'fade',
      onAfterOpen,
      onAfterClose,
      scrollable = false,
      centered = true,
    },
    ref
  ) => {
  const modalRef = useRef<HTMLDivElement>(null!);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const { theme } = useThemeContext();
  const uniqueId = useId();
  const titleId = `lxs-modal-title-${uniqueId}`;
  const descriptionId = `lxs-modal-description-${uniqueId}`;
  // Only use 'sm', 'md', 'lg', 'fullscreen', 'auto'
  let effectiveSize: 'sm' | 'md' | 'lg' | 'fullscreen' | 'auto' = 'md';
  if (size) {
    effectiveSize = size;
  } else if (theme?.global?.size) {
    effectiveSize = theme.global.size;
  }

  // Focus trap
  useFocusTrap<HTMLDivElement>(modalRef, isOpen);

  // Body scroll lock
  useBodyScrollLock(preventScroll && isOpen);

  // Escape key handler
  useEscapeKey(() => {
    if (closeOnEscape && isOpen) {
      onClose();
    }
  });

  // Store and restore focus
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      onAfterOpen?.();
    } else if (previousActiveElement.current) {
      previousActiveElement.current.focus();
      onAfterClose?.();
    }
  }, [isOpen, onAfterOpen, onAfterClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const backdropClassNames = [
    'lxs-modal-backdrop',
    transparentBackdrop && 'lxs-modal-backdrop--transparent',
    centered && 'lxs-modal-backdrop--centered',
    `lxs-modal-backdrop--${animation}`,
    backdropClassName,
  ]
    .filter(Boolean)
    .join(' ');

  const modalClassNames = [
    'lxs-modal',
    `lxs-modal--${effectiveSize}`,
    scrollable && 'lxs-modal--scrollable',
    `lxs-modal--${animation}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const renderHeader = () => {
    if (header) {
      return <div className="lxs-modal-header">{header}</div>;
    }

    if (!title && !showCloseButton) {
      return null;
    }

    return (
      <Flex className="lxs-modal-header" justify="between" align="center" gap={8}>
        {title && (
          <Flex direction="column" gap={4} className="lxs-modal-header-content">
            <Typography as="h2" variant="h6" weight="semibold" id={titleId} noMargin>
              {title}
            </Typography>
            {description && (
              <Typography variant="body2" textColor="var(--color-neutral-600)" id={descriptionId} noMargin>
                {description}
              </Typography>
            )}
          </Flex>
        )}
        {showCloseButton && (
          <Button
            variant="ghost"
            iconOnly
            size="sm"
            className="lxs-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <CloseIcon size={20} />
          </Button>
        )}
      </Flex>
    );
  };

  const modalContent = (
    <div className={backdropClassNames} onClick={handleBackdropClick} aria-hidden="true">
      <div
        ref={(node) => {
          modalRef.current = node!;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        className={modalClassNames}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
      >
        {renderHeader()}
        <Flex direction="column" className="lxs-modal-body">
          {children}
        </Flex>
        {(footer || footerButtons) && (
          <Flex className="lxs-modal-footer" justify="end" align="center" gap={8}>
            {footerButtons
              ? footerButtons.map((btn) => (
                  <Button
                    key={btn.label}
                    variant={btn.variant || 'secondary'}
                    size={btn.size || theme?.global?.size || 'md'}
                    loading={btn.loading}
                    disabled={btn.disabled}
                    onClick={btn.onClick}
                  >
                    {btn.label}
                  </Button>
                ))
              : footer}
          </Flex>
        )}
      </div>
    </div>
  );

    return createPortal(modalContent, document.body);
  }
);

Modal.displayName = 'Modal';

export default Modal;
export { Modal };