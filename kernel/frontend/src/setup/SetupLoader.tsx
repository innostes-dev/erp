import type { ComponentProps } from 'react';

export interface SetupLoaderProps extends ComponentProps<'div'> {
  /** Optional status message displayed under the progress bar. */
  message?: string;
  /** App title or subtitle. Defaults to 'innostes ERP'. */
  brandName?: string;
}

/**
 * Professional, animated full-page loader displayed while determining
 * the system setup and initialization state.
 */
export function SetupLoader({
  message = 'Initializing workspace...',
  brandName = 'innostes',
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute top-1/4 left-1/3 h-72 w-72 rounded-full bg-indigo-500/10 blur-[90px] animate-pulse" />
      </div>

      <div className="relative flex flex-col items-center gap-7 px-4">
        {/* Animated Brand Emblem & Orbit */}
        <div className="relative flex size-24 items-center justify-center">
          {/* Subtle outer glowing aura */}
          <div className="absolute -inset-2 rounded-3xl bg-primary/20 blur-xl animate-pulse" />

          {/* Rotating Outer Dashed Orbit Ring */}
          <svg
            className="absolute inset-0 size-full animate-[spin_8s_linear_infinite] text-primary/30"
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

          {/* Center Brand Monogram Container */}
          <div className="relative flex size-16 items-center justify-center rounded-2xl border border-border/60 bg-card/80 p-3 shadow-lg shadow-primary/5 backdrop-blur-md transition-transform">
            {/* Geometric layered ERP icon */}
            <svg
              className="size-9 text-primary drop-shadow-sm transition-transform duration-300 hover:scale-105"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Top layer */}
              <path
                d="M16 3L27 9.5L16 16L5 9.5L16 3Z"
                fill="currentColor"
                className="opacity-95"
              />
              {/* Middle layer */}
              <path
                d="M5 14L16 20.5L27 14L27 17.5L16 24L5 17.5V14Z"
                fill="currentColor"
                className="opacity-75"
              />
              {/* Bottom foundation layer */}
              <path
                d="M5 21.5L16 28L27 21.5V25L16 31.5L5 25V21.5Z"
                fill="currentColor"
                className="opacity-50"
              />
            </svg>
          </div>
        </div>

        {/* Brand Name & Tag */}
        <div className="flex flex-col items-center gap-1.5 text-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {brandName}
            </span>
            <span className="rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-primary uppercase">
              ERP
            </span>
          </div>
          <p className="text-xs text-muted-foreground/80">Enterprise Resource Platform</p>
        </div>

        {/* Indeterminate Shimmer Progress Bar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative h-1 w-52 overflow-hidden rounded-full bg-muted/80">
            <div
              className="absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-transparent via-primary to-transparent"
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
