import { Button, EmptyState, IconTile } from '@innostes/ui';
import { TracuraPage } from '@innostes/tracura';
import { Power } from 'lucide-react';
import { Link, useNavigation } from '../context/NavigationContext';
import { usePlugins } from '../context/PluginsContext';
import { PLUGINS_CATALOG } from '../catalog';
import { paths } from '../navigation/routes';
import { appIcon } from '../navigation/icons';
import { NotFoundPage } from './NotFoundPage';

export function PluginWorkspace({ pluginId, subId }: { pluginId: string; subId?: string }) {
  const { isPluginActive, activatePlugin } = usePlugins();
  const { navigate } = useNavigation();
  const plugin = PLUGINS_CATALOG.find((p) => p.id === pluginId);
  if (!plugin) return <NotFoundPage />;
  if (subId && !plugin.subFeatures.some((s) => s.id === subId)) return <NotFoundPage />;

  const Icon = appIcon(plugin.id);

  if (!isPluginActive(pluginId)) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center px-4 py-16">
        <EmptyState
          icon={
            <IconTile tone="primary" size="lg">
              <Icon />
            </IconTile>
          }
          title={`${plugin.name} is not active`}
          description="This plugin hasn't been activated for your organization yet. Administrators can activate it in one step."
          actions={
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="secondary" nativeButton={false} render={<Link href={paths.plugins} />}>
                Back to plugins
              </Button>
              <Button startIcon={<Power />} onClick={() => void activatePlugin(pluginId)}>
                Activate {plugin.name}
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  if (plugin.id === 'tracura') {
    const firstSubId = plugin.subFeatures[0]?.id;
    return (
      <TracuraPage
        section={subId ?? firstSubId}
        onSectionChange={(section) => navigate(paths.plugin(plugin.id, section === firstSubId ? undefined : section))}
      />
    );
  }
  return <NotFoundPage />;
}
