import wordmarkOnLight from '@innostes/ui/brand/innostes-wordmark-on-light.png';
import wordmarkOnDark from '@innostes/ui/brand/innostes-wordmark-on-dark.png';
import symbolOnLight from '@innostes/ui/brand/innostes-symbol.png';
import symbolOnDark from '@innostes/ui/brand/innostes-symbol-on-dark.png';
import { cn } from '@/lib/cn';

/**
 * The INNOSTES logo, from the shared brand assets in @innostes/ui (same artwork as the product).
 * `wordmark` (default) for headers and footers; `symbol` for tight square spaces.
 * Pass `surface="dark"` on navy bands; otherwise it follows the site's light/dark theme.
 */
export function Logo({
  variant = 'wordmark',
  surface,
  className,
}: {
  variant?: 'wordmark' | 'symbol';
  surface?: 'dark';
  className?: string;
}) {
  const light = variant === 'symbol' ? symbolOnLight : wordmarkOnLight;
  const dark = variant === 'symbol' ? symbolOnDark : wordmarkOnDark;
  const size = cn(variant === 'symbol' ? 'size-7' : 'h-6 w-auto', className);
  if (surface === 'dark') {
    return <img src={dark.src} alt="INNOSTES" className={size} draggable={false} />;
  }
  return (
    <>
      <img src={light.src} alt="INNOSTES" className={cn(size, 'dark:hidden')} draggable={false} />
      <img src={dark.src} alt="INNOSTES" className={cn(size, 'hidden dark:block')} draggable={false} />
    </>
  );
}
