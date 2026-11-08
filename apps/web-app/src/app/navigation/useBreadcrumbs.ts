import { useEffect } from 'react';
import { BUSINESS_MODULES_CATALOG, PLUGINS_CATALOG } from '../catalog';
import { useNavigation } from '../context/NavigationContext';
import { paths, type Route } from './routes';

export interface Crumb {
  label: string;
  href?: string;
}

/** Breadcrumb trail for a route: the single source for the top bar and the document title. */
export function crumbsFor(route: Route): Crumb[] {
  const home: Crumb = { label: 'Home', href: paths.home };
  switch (route.kind) {
    case 'home':
      return [{ label: 'Home' }];
    case 'modules-catalog':
      return [home, { label: 'Modules' }];
    case 'plugins-catalog':
      return [home, { label: 'Plugins' }];
    case 'audit':
      return [home, { label: 'Administration', href: paths.apiKeys }, { label: 'Audit trail' }];
    case 'api-keys':
      return [home, { label: 'Administration', href: paths.apiKeys }, { label: 'API keys' }];
    case 'module':
    case 'plugin': {
      const isModule = route.kind === 'module';
      const id = isModule ? route.moduleId : route.pluginId;
      const app = (isModule ? BUSINESS_MODULES_CATALOG : PLUGINS_CATALOG).find((a) => a.id === id);
      const appHref = isModule ? paths.module(id) : paths.plugin(id);
      const sub = route.subId ? app?.subFeatures.find((s) => s.id === route.subId) : app?.subFeatures[0];
      const trail: Crumb[] = [
        home,
        { label: isModule ? 'Modules' : 'Plugins', href: isModule ? paths.modules : paths.plugins },
        { label: app?.name ?? id, href: appHref },
      ];
      if (sub) trail.push({ label: sub.label });
      return trail;
    }
    default:
      return [home, { label: 'Page not found' }];
  }
}

/** Current breadcrumbs. Also keeps `document.title` in sync, e.g. "Leave · PeopleOps · INNOSTES". */
export function useBreadcrumbs(): Crumb[] {
  const { route } = useNavigation();
  const crumbs = crumbsFor(route);
  const title = crumbs
    .slice(route.kind === 'home' ? 0 : 1)
    .filter((c) => c.label !== 'Modules' && c.label !== 'Plugins' && c.label !== 'Administration')
    .map((c) => c.label)
    .reverse()
    .join(' · ');

  useEffect(() => {
    document.title = `${title} · INNOSTES Business OS`;
  }, [title]);

  return crumbs;
}
