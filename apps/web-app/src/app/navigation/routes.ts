/**
 * URL contract of the Business OS shell. Every page and module sub-page is addressable,
 * so refresh, deep links, bookmarks and the browser Back button keep the user's place.
 *
 *   /                                  Home
 *   /modules                           Module catalog
 *   /modules/:moduleId[/:subId]        Module workspace (e.g. /modules/peopleops/leave)
 *   /plugins                           Plugin catalog
 *   /plugins/:pluginId[/:subId]        Plugin workspace (e.g. /plugins/tracura/logs)
 *   /administration/audit              Audit trail   (legacy alias: /audit)
 *   /administration/api-keys           API keys      (legacy aliases: /administration, /api-keys)
 */
export type Route =
  | { kind: 'home' }
  | { kind: 'modules-catalog' }
  | { kind: 'module'; moduleId: string; subId?: string }
  | { kind: 'plugins-catalog' }
  | { kind: 'plugin'; pluginId: string; subId?: string }
  | { kind: 'audit' }
  | { kind: 'api-keys' }
  | { kind: 'not-found' };

export const paths = {
  home: '/',
  modules: '/modules',
  module: (moduleId: string, subId?: string) =>
    subId ? `/modules/${moduleId}/${subId}` : `/modules/${moduleId}`,
  plugins: '/plugins',
  plugin: (pluginId: string, subId?: string) =>
    subId ? `/plugins/${pluginId}/${subId}` : `/plugins/${pluginId}`,
  audit: '/administration/audit',
  apiKeys: '/administration/api-keys',
} as const;

export function parseRoute(pathname: string): Route {
  const segments = pathname.split('/').filter(Boolean).map(decodeURIComponent);
  const [first, second, third] = segments;

  if (!first) return { kind: 'home' };
  if (first === 'modules') {
    return second ? { kind: 'module', moduleId: second, subId: third } : { kind: 'modules-catalog' };
  }
  if (first === 'plugins') {
    return second ? { kind: 'plugin', pluginId: second, subId: third } : { kind: 'plugins-catalog' };
  }
  if (first === 'audit') return { kind: 'audit' };
  if (first === 'api-keys') return { kind: 'api-keys' };
  if (first === 'administration') {
    if (!second || second === 'api-keys') return { kind: 'api-keys' };
    if (second === 'audit') return { kind: 'audit' };
  }
  return { kind: 'not-found' };
}
