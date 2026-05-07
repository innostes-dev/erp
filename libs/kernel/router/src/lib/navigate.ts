/**
 * Imperative navigation usable outside React components.
 * Requires the router singleton to be set during shell bootstrap.
 */
let _push: ((href: string) => void) | null = null;
let _replace: ((href: string) => void) | null = null;

export function registerRouter(push: (href: string) => void, replace: (href: string) => void) {
  _push = push;
  _replace = replace;
}

export function navigate(href: string, replace = false): void {
  const fn = replace ? _replace : _push;
  if (!fn) {
    throw new Error('Router not registered. Call registerRouter() in your root layout.');
  }
  fn(href);
}
