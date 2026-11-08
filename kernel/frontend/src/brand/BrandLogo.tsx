import logoOnLight from '@innostes/ui/brand/innostes-logo-on-light.png';
import logoOnDark from '@innostes/ui/brand/innostes-logo-on-dark.png';
import wordmarkOnLight from '@innostes/ui/brand/innostes-wordmark-on-light.png';
import wordmarkOnDark from '@innostes/ui/brand/innostes-wordmark-on-dark.png';
import symbolOnLight from '@innostes/ui/brand/innostes-symbol.png';
import symbolOnDark from '@innostes/ui/brand/innostes-symbol-on-dark.png';
import { cn } from '@innostes/ui';

/** Product name used in titles and lockups. */
export const PRODUCT_NAME = 'INNOSTES Business OS';

const SOURCES = {
  full: { light: logoOnLight, dark: logoOnDark },
  wordmark: { light: wordmarkOnLight, dark: wordmarkOnDark },
  symbol: { light: symbolOnLight, dark: symbolOnDark },
} as const;

export interface BrandLogoProps {
  /**
   * `full`: wordmark + tagline (≥ 48px tall) · `wordmark`: no tagline (headers, sidebar) ·
   * `symbol`: head icon only (collapsed sidebar, small tiles).
   * @default 'wordmark'
   */
  variant?: keyof typeof SOURCES;
  /** Background the logo sits on. `dark` = Midnight Navy surfaces. @default 'light' */
  surface?: 'light' | 'dark';
  /** Show "Business OS" next to / under the wordmark. @default false */
  withProductLabel?: boolean;
  className?: string;
  /** Classes for the <img>, usually a height such as `h-6`. */
  imageClassName?: string;
}

/**
 * The INNOSTES logo. The single brand piece used by the shell, auth and setup screens.
 * Logo artwork lives in `@innostes/ui/brand/*` (see packages/ui/assets/brand/README.md).
 */
export function BrandLogo({
  variant = 'wordmark',
  surface = 'light',
  withProductLabel = false,
  className,
  imageClassName,
}: BrandLogoProps) {
  const image = (
    <img
      src={SOURCES[variant][surface]}
      alt={withProductLabel ? 'INNOSTES' : PRODUCT_NAME}
      className={cn('w-auto select-none', variant === 'symbol' ? 'h-8' : 'h-6', imageClassName)}
      draggable={false}
    />
  );
  if (!withProductLabel) return <span className={cn('inline-flex', className)}>{image}</span>;
  return (
    <span className={cn('inline-flex flex-col items-start gap-1.5', className)}>
      {image}
      <span
        className={cn(
          'text-caption leading-none font-medium',
          surface === 'dark' ? 'text-sidebar-muted-foreground' : 'text-muted-foreground',
        )}
      >
        Business OS
      </span>
    </span>
  );
}
