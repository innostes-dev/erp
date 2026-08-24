"use client";

import * as React from 'react';
import './Container.css';

// ── Types ────────────────────────────────────────────────────────────────────

export type ContainerAs =
  | 'div'
  | 'section'
  | 'article'
  | 'aside'
  | 'main'
  | 'header'
  | 'footer'
  | 'nav';

/**
 * Fixed max-width breakpoints (mirrors Bootstrap container widths).
 *
 * | value        | max-width |
 * |-------------|-----------|
 * | `xs`        | 100%      |
 * | `sm`        | 540px     |
 * | `md`        | 720px     |
 * | `lg`        | 960px     |
 * | `xl`        | 1140px    |
 * | `xxl`       | 1320px    |
 * | `full`      | 100%      |
 * | `none`      | unset     |
 * | `responsive`| steps up at each breakpoint like Bootstrap `.container` |
 */
export type ContainerMaxWidth =
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | 'xxl'
  | 'full'
  | 'none'
  | 'responsive';

/** Horizontal padding (gutter) inside the container */
export type ContainerGutter = 'none' | 'sm' | 'md' | 'lg';

export interface ContainerProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * HTML element to render as.
   * @default 'div'
   */
  as?: ContainerAs;

  /**
   * Maximum width of the container.
   * `responsive` mirrors Bootstrap `.container` — steps up at each breakpoint.
   * @default 'responsive'
   */
  maxWidth?: ContainerMaxWidth;

  /**
   * When true, container always spans the full width (overrides `maxWidth`).
   * Equivalent to Bootstrap `.container-fluid`.
   * @default false
   */
  fluid?: boolean;

  /**
   * Horizontal padding (gutter) applied inside the container.
   * Responsive: `md` grows to 24 px ≥ 768 px; `lg` grows further at larger screens.
   * @default 'md'
   */
  gutter?: ContainerGutter;

  /**
   * When true, centers the container with `margin: auto`.
   * @default true
   */
  centered?: boolean;

  /**
   * Additional CSS class names.
   */
  className?: string;

  /**
   * Container children.
   */
  children?: React.ReactNode;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Container — responsive layout wrapper.
 *
 * Constrains content width, handles horizontal gutters, and centers the
 * layout. Polymorphic via the `as` prop so it renders the semantically
 * correct HTML element.
 *
 * @example
 * Default (responsive, centered, md gutters):
 * ```tsx
 * <Container>
 *   <h1>Hello</h1>
 * </Container>
 * ```
 *
 * @example
 * Fixed xl width, large gutters:
 * ```tsx
 * <Container maxWidth="xl" gutter="lg">
 *   <Layout />
 * </Container>
 * ```
 *
 * @example
 * Full-width fluid section:
 * ```tsx
 * <Container as="section" fluid gutter="none">
 *   <HeroBanner />
 * </Container>
 * ```
 */
const Container = React.forwardRef<HTMLElement, ContainerProps>(
  (
    {
      as: Tag = 'div',
      maxWidth = 'responsive',
      fluid = false,
      gutter = 'md',
      centered = true,
      className = '',
      children,
      ...rest
    },
    ref
  ) => {
    const classNames = [
      'lxs-container',
      centered && 'lxs-container--centered',
      fluid ? 'lxs-container--fluid' : `lxs-container--${maxWidth}`,
      `lxs-container--gutter-${gutter}`,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      // @ts-expect-error – polymorphic ref assignment; safe because ContainerAs
      // is a strict subset of HTML element tags.
      <Tag ref={ref} className={classNames} {...rest}>
        {children}
      </Tag>
    );
  }
);

Container.displayName = 'Container';

export { Container };
export default Container;
