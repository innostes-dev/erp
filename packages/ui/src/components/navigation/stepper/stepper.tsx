'use client';

import { forwardRef, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../../../lib/cn';
import type { SlotClassNames } from '../../../lib/slots';
import { CheckIcon, XIcon } from '../../../lib/icons';

/** The state of one step. Derived from `currentStep` unless set on the step. */
export type StepStatus = 'complete' | 'current' | 'upcoming' | 'error';

/** One step of a `Stepper`. */
export interface StepperStep {
  /** Step title, e.g. "Organization". */
  title: ReactNode;
  /** Short hint under the title, e.g. "Basic details". */
  description?: ReactNode;
  /** Override the derived status, e.g. `'error'` when this step failed validation. */
  status?: StepStatus;
  /** Icon shown instead of the step number. */
  icon?: ReactNode;
}

/** Inner parts of a `Stepper`, for `classNames`. */
export type StepperSlot = 'list' | 'item' | 'marker' | 'title' | 'description' | 'connector';

export interface StepperProps extends Omit<ComponentProps<'nav'>, 'onChange'> {
  /** The steps, in order. */
  steps: readonly StepperStep[];
  /** Index of the current step, from 0. Steps before it are complete. */
  currentStep: number;
  /**
   * Make completed steps clickable to jump back. Called with the step index.
   * Leave it out for a read-only progress indicator.
   */
  onStepClick?: (index: number) => void;
  /** Layout. @default 'horizontal' */
  orientation?: 'horizontal' | 'vertical';
  /**
   * Where titles go in the horizontal layout: centred under each marker, or next to it.
   * @default 'bottom'
   */
  labelPlacement?: 'bottom' | 'end';
  /** Marker size. @default 'md' */
  size?: 'sm' | 'md';
  /** Classes for inner parts. */
  classNames?: SlotClassNames<StepperSlot>;
  /**
   * Accessible status labels for assistive technology.
   * @default { completedGoBack: '(completed, go back to this step)', completed: '(completed)', hasErrors: '(has errors)' }
   */
  labels?: {
    completedGoBack?: string;
    completed?: string;
    hasErrors?: string;
  };
  /** Accessible name. @default 'Progress' */
  'aria-label'?: string;
}

/**
 * Shows progress through a multi-step flow, such as setup wizards, onboarding or checkout.
 * Completed steps get a check, the current step is highlighted, and steps can be made
 * clickable to go back.
 *
 * @example
 * <Stepper
 *   currentStep={step}
 *   onStepClick={setStep}
 *   steps={[
 *     { title: 'Organization', description: 'Basic details' },
 *     { title: 'Database', description: 'Connect & verify' },
 *     { title: 'Review', description: 'Confirm settings' },
 *   ]}
 * />
 */
export const Stepper = forwardRef<HTMLElement, StepperProps>(function Stepper(
  {
    steps,
    currentStep,
    onStepClick,
    orientation = 'horizontal',
    labelPlacement = 'bottom',
    size = 'md',
    labels,
    className,
    classNames,
    'aria-label': ariaLabel = 'Progress',
    ...props
  },
  ref,
) {
  const vertical = orientation === 'vertical';
  const stacked = !vertical && labelPlacement === 'bottom';
  const completedGoBack =
    labels?.completedGoBack ?? '(completed, go back to this step)';
  const completedLabel = labels?.completed ?? '(completed)';
  const hasErrorsLabel = labels?.hasErrors ?? '(has errors)';

  return (
    <nav
      ref={ref}
      aria-label={ariaLabel}
      data-slot="stepper"
      data-orientation={orientation}
      className={cn(!vertical && '@container', className)}
      {...props}
    >
      <ol className={cn('flex', vertical ? 'flex-col' : 'w-full items-start', classNames?.list)}>
        {steps.map((step, index) => {
          const status: StepStatus =
            step.status ??
            (index < currentStep
              ? 'complete'
              : index === currentStep
                ? 'current'
                : 'upcoming');
          const isLast = index === steps.length - 1;
          const clickable = !!onStepClick && status === 'complete';
          const marker = (
            <span
              aria-hidden="true"
              className={cn(
                'relative z-10 flex shrink-0 items-center justify-center rounded-full border-2 font-semibold tabular-nums transition-colors',
                size === 'sm' ? 'size-7 text-xs' : 'size-9 text-sm',
                status === 'complete' &&
                  'border-primary bg-primary text-primary-foreground',
                status === 'current' &&
                  'border-primary bg-primary text-primary-foreground ring-4 ring-primary/15',
                status === 'upcoming' &&
                  'border-border bg-background text-muted-foreground',
                status === 'error' &&
                  'border-destructive bg-destructive text-destructive-foreground',
                "[&_svg:not([class*='size-'])]:size-4",
                classNames?.marker,
              )}
            >
              {status === 'complete' ? (
                <CheckIcon strokeWidth={3} />
              ) : status === 'error' ? (
                <XIcon strokeWidth={3} />
              ) : (
                (step.icon ?? index + 1)
              )}
            </span>
          );
          const text = (
            <span
              className={cn(
                'flex min-w-0 flex-col gap-0.5',
                stacked ? 'items-center text-center' : 'text-start',
              )}
            >
              <span
                className={cn(
                  'text-sm font-medium',
                  status === 'current' && 'text-primary',
                  status === 'upcoming' && 'text-foreground/80',
                  status === 'error' && 'text-red-600 dark:text-red-400',
                  // On narrow containers only the current step's title stays visible.
                  !vertical && status !== 'current' && '@max-xl:sr-only',
                  classNames?.title,
                )}
              >
                {step.title}
              </span>
              {step.description && (
                <span
                  className={cn(
                    'text-xs text-muted-foreground',
                    !vertical && '@max-3xl:hidden',
                    classNames?.description,
                  )}
                >
                  {step.description}
                </span>
              )}
            </span>
          );
          const content = (
            <>
              {marker}
              {text}
            </>
          );
          const connector = !isLast && (
            <span
              aria-hidden="true"
              className={cn(
                'absolute bg-border transition-colors',
                index < currentStep && 'bg-primary',
                vertical
                  ? cn(
                      'start-[calc(var(--marker)/2-1px)] top-(--marker) bottom-0 w-0.5',
                    )
                  : stacked
                    ? 'start-[calc(50%+var(--marker)/2+0.5rem)] end-[calc(-50%+var(--marker)/2+0.5rem)] top-[calc(var(--marker)/2-1px)] h-0.5'
                    : 'start-[calc(var(--marker)+0.5rem)] end-2 top-[calc(var(--marker)/2-1px)] h-0.5',
                classNames?.connector,
              )}
            />
          );

          return (
            <li
              key={index}
              data-status={status}
              aria-current={status === 'current' ? 'step' : undefined}
              style={{
                ['--marker' as string]: size === 'sm' ? '1.75rem' : '2.25rem',
              }}
              className={cn(
                'relative flex',
                vertical ? 'min-h-16 pb-6 last:pb-0' : 'flex-1',
                !vertical && isLast && !stacked && 'flex-none',
                classNames?.item,
              )}
            >
              {connector}
              {clickable ? (
                <button
                  type="button"
                  onClick={() => onStepClick?.(index)}
                  className={cn(
                    'group flex cursor-pointer gap-3 rounded-md outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring',
                    stacked
                      ? 'w-full flex-col items-center'
                      : 'items-start pe-4',
                  )}
                >
                  {content}
                  <span className="sr-only">{completedGoBack}</span>
                </button>
              ) : (
                <div
                  className={cn(
                    'flex gap-3',
                    stacked
                      ? 'w-full flex-col items-center'
                      : 'items-start pe-4',
                  )}
                >
                  {content}
                  {status === 'complete' && (
                    <span className="sr-only">{completedLabel}</span>
                  )}
                  {status === 'error' && (
                    <span className="sr-only">{hasErrorsLabel}</span>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
});
