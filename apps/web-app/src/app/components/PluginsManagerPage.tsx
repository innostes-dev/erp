import { useState, useMemo } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  IconTile,
  Badge,
  SearchInput,
  Tabs,
  TabsList,
  TabsTab,
} from '@innostes/ui';
import { Puzzle, Activity, ArrowRight, Power, PowerOff } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { usePlugins } from '../context/PluginsContext';
import type { CatalogItem } from '../catalog';

function getPluginIcon(id: string) {
  switch (id) {
    case 'api-logger':
      return <Activity className="size-5" />;
    default:
      return <Puzzle className="size-5" />;
  }
}

export function PluginsManagerPage() {
  const { navigate } = useNavigation();
  const { allPlugins, isPluginActive, activatePlugin, deactivatePlugin } =
    usePlugins();
  const [query, setQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'inactive'>(
    'all',
  );
  const [mutatingId, setMutatingId] = useState<string | null>(null);

  const filteredPlugins = useMemo(() => {
    return allPlugins.filter((plugin) => {
      const active = isPluginActive(plugin.id);
      if (filterTab === 'active' && !active) return false;
      if (filterTab === 'inactive' && active) return false;

      if (!query.trim()) return true;
      const q = query.toLowerCase();
      const inName = plugin.name.toLowerCase().includes(q);
      const inDesc = plugin.description.toLowerCase().includes(q);
      const inTags = plugin.subFeatures.some((f) =>
        f.label.toLowerCase().includes(q),
      );
      return inName || inDesc || inTags;
    });
  }, [allPlugins, isPluginActive, filterTab, query]);

  async function handleToggle(plugin: CatalogItem) {
    const active = isPluginActive(plugin.id);
    setMutatingId(plugin.id);
    try {
      if (active) {
        await deactivatePlugin(plugin.id);
      } else {
        await activatePlugin(plugin.id);
      }
    } finally {
      setMutatingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 max-w-6xl mx-auto w-full">
      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              onClick={() => navigate('/')}
              className="cursor-pointer"
            >
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Plugins</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Puzzle className="size-6 text-primary" />
            Plugins & Tools
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Discover, activate, and configure extensible developer,
            productivity, and system plugins.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <SearchInput
            placeholder="Search plugins and tools..."
            value={query}
            onValueChange={setQuery}
          />
        </div>

        <Tabs
          value={filterTab}
          onValueChange={(val) =>
            setFilterTab(val as 'all' | 'active' | 'inactive')
          }
        >
          <TabsList>
            <TabsTab value="all">All Plugins</TabsTab>
            <TabsTab value="active">Active</TabsTab>
            <TabsTab value="inactive">Inactive</TabsTab>
          </TabsList>
        </Tabs>
      </div>

      {/* Plugins List / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPlugins.map((plugin) => {
          const active = isPluginActive(plugin.id);
          const isPending = mutatingId === plugin.id;

          return (
            <div
              key={plugin.id}
              className="flex flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-2xs hover:shadow-xs transition-shadow"
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <IconTile tone={plugin.tone} size="lg">
                      {getPluginIcon(plugin.id)}
                    </IconTile>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-foreground">
                          {plugin.name}
                        </h2>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono"
                        >
                          v{plugin.version}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Extensible System Plugin
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant={active ? 'success' : 'secondary'}
                    dot={active}
                  >
                    {active ? 'ACTIVE' : 'INACTIVE'}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                  {plugin.description}
                </p>

                {/* Sub Features */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {plugin.subFeatures.map((feat) => (
                    <span
                      key={feat.id}
                      className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                    >
                      {feat.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between gap-3">
                <Button
                  variant={active ? 'outline' : 'primary'}
                  size="sm"
                  loading={isPending}
                  startIcon={
                    active ? (
                      <PowerOff className="size-3.5" />
                    ) : (
                      <Power className="size-3.5" />
                    )
                  }
                  onClick={() => void handleToggle(plugin)}
                >
                  {active ? 'Deactivate' : 'Activate Plugin'}
                </Button>

                {active && (
                  <Button
                    variant="ghost"
                    size="sm"
                    endIcon={<ArrowRight className="size-3.5" />}
                    onClick={() => navigate(`/plugins/${plugin.id}`)}
                  >
                    Open Plugin
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredPlugins.length === 0 && (
        <div className="py-12 text-center text-muted-foreground text-sm">
          No plugins match your current search and filter criteria.
        </div>
      )}
    </div>
  );
}
