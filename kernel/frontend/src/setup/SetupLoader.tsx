import { BrandLogo } from '../brand';
import type { ComponentProps } from 'react';

export interface SetupLoaderProps extends ComponentProps<'div'> {
  /** Optional status message displayed under the progress bar. */
  message?: string;
  /** App title or subtitle. Defaults to 'INNOSTES'. */
  brandName?: string;
}

/**
 * Professional, animated full-page loader displayed while determining
 * the system setup and initialization state.
 */
export function SetupLoader({
  message = 'Initializing workspace...',
  brandName = 'INNOSTES',
  className = '',
  ...props
}: SetupLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading workspace"
      className={`fixed inset-0 z-50 flex min-h-svh w-full flex-col items-center justify-center overflow-hidden bg-background text-foreground select-none ${className}`}
      {...props}
    >
      {/* Background ambient lighting */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-70 dark:opacity-40"
        aria-hidden="true"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-primary-tint blur-[120px]" />
        <div className="absolute top-1/4 left-1/3 h-72 w-72 rounded-full bg-primary-tint blur-[90px] animate-pulse" />
      </div>

      <div className="relative flex flex-col items-center gap-7 px-4">
        {/* Animated Brand Emblem & Orbit */}
        <div className="relative flex size-24 items-center justify-center">
          {/* Subtle outer glowing aura */}
          <div className="absolute -inset-2 rounded-3xl bg-primary-tint blur-xl animate-pulse" />

          {/* Rotating Outer Dashed Orbit Ring */}
          <svg
            className="absolute inset-0 size-full animate-[spin_8s_linear_infinite] text-primary"
            viewBox="0 0 100 100"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="50"
              cy="50"
              r="46"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="6 8"
            />
          </svg>

          {/* Reverse Rotating Accent Arc */}
          <svg
            className="absolute inset-0 size-full animate-[spin_3s_linear_infinite_reverse] text-primary"
            viewBox="0 0 100 100"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="50"
              cy="50"
              r="46"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="40 240"
            />
          </svg>

          {/* Center brand symbol */}
          <div className="relative flex size-16 items-center justify-center rounded-lg border border-border bg-card p-2.5">
            <BrandLogo variant="symbol" imageClassName="size-10" />
          </div>
        </div>

        {/* Brand name */}
        <div className="flex flex-col items-center gap-1.5 text-center">
          <span className="text-subheading font-semibold text-foreground">{brandName}</span>
          <p className="text-caption text-muted-foreground">Business OS</p>
        </div>

        {/* Indeterminate Shimmer Progress Bar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative h-1 w-52 overflow-hidden rounded-full bg-muted">
            <div
              className="absolute inset-y-0 w-1/3 rounded-full bg-primary"
              style={{
                animation: 'loaderShimmer 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite',
              }}
            />
          </div>

          {/* Status feedback & pulsing indicator */}
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            <span>{message}</span>
          </div>
        </div>
      </div>

      {/* Embedded CSS for smooth shimmer animation without relying on custom config */}
      <style>{`
        @keyframes loaderShimmer {
          0% {
            left: -35%;
          }
          100% {
            left: 110%;
          }
        }
      `}</style>
    </div>
  );
}
