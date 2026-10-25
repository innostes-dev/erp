import { forwardRef, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../../lib/cn';
import type { SlotClassNames } from '../../lib/slots';

export type WelcomeBannerSlot = 'root' | 'eyebrow' | 'title' | 'description' | 'actions' | 'aside' | 'quote';

export interface WelcomeBannerProps extends Omit<ComponentProps<'section'>, 'title'> {
  /** Small line above the title, e.g. the date ("April 2025"). */
  eyebrow?: ReactNode;
  /** Greeting, e.g. "Welcome back, Arun". */
  title: ReactNode;
  /** One line under the title. */
  description?: ReactNode;
  /** Buttons under the text. */
  actions?: ReactNode;
  /**
   * Illustration or image on the end side. Hidden when the banner is narrow, so the text always
   * has room.
   */
  illustration?: ReactNode;
  /** A short quote shown on wide banners, e.g. a company value. */
  quote?: ReactNode;
  /**
   * Background. `gradient` uses a soft wash of the primary colour; `plain` uses the card colour;
   * `brand` uses a solid primary background with light text.
   * @default 'gradient'
   */
  variant?: 'gradient' | 'plain' | 'brand';
  /** Classes for inner parts. */
  classNames?: SlotClassNames<WelcomeBannerSlot>;
}

/**
 * The greeting at the top of a dashboard, with an optional illustration and quote. The layout
 * responds to the banner's own width (container queries), so it works in any column.
 *
 * @example
 * <WelcomeBanner
 *   eyebrow="April 2025"
 *   title="Welcome back, Arun"
 *   description="Here's what's happening in HRMS today."
 *   illustration={<img src="/team.svg" alt="" />}
 *   quote="Great people build great companies."
 * />
 */
export const WelcomeBanner = forwardRef<HTMLElement, WelcomeBannerProps>(function WelcomeBanner(
  { className, eyebrow, title, description, actions, illustration, quote, variant = 'gradient', classNames, ...props },
  ref,
) {
  const brand = variant === 'brand';
  return (
    <section
      ref={ref}
      data-slot="welcome-banner"
      data-variant={variant}
      className={cn(
        '@container relative overflow-hidden rounded-xl border',
        variant === 'gradient' && 'border-border bg-linear-to-br from-primary/10 via-primary/5 to-card',
        variant === 'plain' && 'border-border bg-card',
        brand && 'border-transparent bg-primary text-primary-foreground',
        classNames?.root,
        className,
      )}
      {...props}
    >
      <div className="flex min-h-36 items-center gap-6 p-5 @2xl:p-8">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          {eyebrow && (
            <span data-slot="welcome-banner-eyebrow" className={cn('text-sm', brand ? 'text-primary-foreground/80' : 'text-muted-foreground', classNames?.eyebrow)}>
              {eyebrow}
            </span>
          )}
          <h2 data-slot="welcome-banner-title" className={cn('text-heading font-bold tracking-tight', classNames?.title)}>
            {title}
          </h2>
          {description && (
            <p data-slot="welcome-banner-description" className={cn(brand ? 'text-primary-foreground/85' : 'text-muted-foreground', classNames?.description)}>
              {description}
            </p>
          )}
          {actions && (
            <div data-slot="welcome-banner-actions" className={cn('mt-3 flex flex-wrap gap-2', classNames?.actions)}>
              {actions}
            </div>
          )}
        </div>
        {illustration && (
          <div
            data-slot="welcome-banner-aside"
            aria-hidden="true"
            className={cn('hidden max-h-44 shrink-0 @xl:flex [&>img]:h-full [&>img]:w-auto [&>svg]:h-full [&>svg]:w-auto', classNames?.aside)}
          >
            {illustration}
          </div>
        )}
        {quote && (
          <blockquote
            data-slot="welcome-banner-quote"
            className={cn(
              'hidden max-w-56 shrink-0 self-start text-end text-sm italic @4xl:block',
              brand ? 'text-primary-foreground/85' : 'text-muted-foreground',
              classNames?.quote,
            )}
          >
            “{quote}”
          </blockquote>
        )}
      </div>
    </section>
  );
});
