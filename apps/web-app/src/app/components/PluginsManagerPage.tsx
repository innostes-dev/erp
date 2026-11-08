import { usePlugins } from '../context/PluginsContext';
import { paths } from '../navigation/routes';
import { CatalogPage } from './CatalogPage';

export function PluginsManagerPage() {
  const { allPlugins, isPluginActive, activatePlugin, deactivatePlugin } = usePlugins();
  return (
    <CatalogPage
      noun="plugin"
      title="Plugins"
      description="Extend the platform with developer and productivity tools."
      items={allPlugins}
      isActive={isPluginActive}
      activate={activatePlugin}
      deactivate={deactivatePlugin}
      canManage
      hrefFor={(id) => paths.plugin(id)}
    />
  );
}
