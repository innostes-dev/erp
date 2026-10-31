import React from 'react';
import {
  WelcomeBanner,
  EmptyState,
  Button,
  IconTile,
  WidgetCard,
  ActivityFeed,
  ActionList,
  Badge,
} from '@innostes/ui';
import { useAuth } from '@innostes/kernel';
import {
  ArrowRight,
  ChevronRight,
  LayoutGrid,
  Puzzle,
  Building2,
  Users,
  Activity,
  Star,
  CheckCircle2,
  AlertTriangle,
  FileCode2,
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { useModules } from '../context/ModulesContext';
import { usePlugins } from '../context/PluginsContext';
import type { CatalogItem } from '../catalog';

const MountainIllustration = (
  <svg
    viewBox="0 0 450 180"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="h-36 w-auto opacity-90 select-none pointer-events-none"
  >
    <circle cx="260" cy="50" r="28" fill="currentColor" className="text-primary/10" />
    <path
      d="M50 180 L140 100 L210 145 L300 70 L390 150 L450 110 L450 180 Z"
      fill="currentColor"
      className="text-primary/15"
    />
    <path
      d="M120 180 L220 115 L290 155 L380 90 L450 135 L450 180 Z"
      fill="currentColor"
      className="text-primary/25"
    />
    <g className="text-primary/45" fill="currentColor">
      <polygon points="360,180 340,180 350,140" />
      <polygon points="350,110 335,145 365,145" />
      <polygon points="350,130 330,165 370,165" />
      <polygon points="395,180 375,180 385,130" />
      <polygon points="385,95 368,135 402,135" />
      <polygon points="385,120 364,158 406,158" />
      <polygon points="430,180 415,180 422,145" />
      <polygon points="422,118 410,148 435,148" />
    </g>
  </svg>
);

function getItemIcon(id: string) {
  switch (id) {
    case 'hrms':
      return <Users className="size-5" />;
    case 'crm':
      return <Building2 className="size-5" />;
    case 'tracura':
    case 'api-logger':
      return <Activity className="size-5" />;
    default:
      return <LayoutGrid className="size-5" />;
  }
}

export function EcosystemHome() {
  const { user } = useAuth();
  const { navigate } = useNavigation();
  const { activeModules } = useModules();
  const { activePlugins } = usePlugins();

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const firstName = user?.first_name || 'Arun';

  const recentActivityItems = [
    {
      id: '1',
      title: 'CRM: Opened Acme Corporation',
      time: '2 min ago',
      icon: <Building2 className="size-3.5" />,
      tone: 'chart-2' as const,
    },
    {
      id: '2',
      title: 'ERP: Viewed Sales Orders',
      time: '15 min ago',
      icon: <LayoutGrid className="size-3.5" />,
      tone: 'chart-1' as const,
    },
    {
      id: '3',
      title: 'Tracura: Checked API Errors',
      time: '1 hr ago',
      icon: <Activity className="size-3.5" />,
      tone: 'chart-4' as const,
    },
    {
      id: '4',
      title: 'HRMS: Reviewed Leave Requests',
      time: '3 hr ago',
      icon: <Users className="size-3.5" />,
      tone: 'chart-3' as const,
    },
  ];

  const favoritesList = [
    {
      id: 'erp',
      title: 'ERP Platform',
      description: 'Complete business management',
      icon: <LayoutGrid className="size-4" />,
      tone: 'chart-1' as const,
      action: <Star className="size-4 fill-amber-400 text-amber-400" />,
    },
    {
      id: 'crm',
      title: 'CRM',
      description: 'Customers and relationships',
      icon: <Building2 className="size-4" />,
      tone: 'chart-2' as const,
      action: <Star className="size-4 fill-amber-400 text-amber-400" />,
    },
    {
      id: 'hrms',
      title: 'HRMS',
      description: 'People and human resources',
      icon: <Users className="size-4" />,
      tone: 'chart-3' as const,
      action: <Star className="size-4 fill-amber-400 text-amber-400" />,
    },
  ];

  return (
    <div className="flex flex-col gap-8 p-6 md:p-8 max-w-7xl mx-auto w-full">
      {/* Top Welcome Banner */}
      <WelcomeBanner
        eyebrow={formattedDate}
        title={`Good morning, ${firstName}`}
        description="Here's what's happening in your ecosystem."
        illustration={MountainIllustration}
        quote="One platform. Everything your business needs."
        variant="gradient"
      />

      {/* Modules Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <LayoutGrid className="size-4.5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground">Modules</h2>
              <p className="text-xs text-muted-foreground">Core business applications to run your organization.</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            endIcon={<ArrowRight className="size-3.5" />}
            onClick={() => navigate('/modules')}
          >
            View all modules
          </Button>
        </div>

        {activeModules.length === 0 ? (
          <EmptyState
            icon={
              <IconTile tone="primary" size="lg">
                <LayoutGrid className="size-6" />
              </IconTile>
            }
            title="No business modules activated yet"
            description="At initial setup, business modules are 0. Activate modules like HRMS and CRM from the Modules catalog to unlock business capabilities."
            actions={
              <Button
                variant="primary"
                endIcon={<ArrowRight className="size-4" />}
                onClick={() => navigate('/modules')}
              >
                Go to Modules to Activate →
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {activeModules.map((mod: CatalogItem) => (
              <div
                key={mod.id}
                onClick={() => navigate(`/modules/${mod.id}`)}
                className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-2xs hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <IconTile tone={mod.tone} size="lg">
                      {getItemIcon(mod.id)}
                    </IconTile>
                    <div className="flex size-7 items-center justify-center rounded-full bg-muted/50 text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <ChevronRight className="size-4" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                    {mod.name}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {mod.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-border/60 flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
                  {mod.subFeatures.slice(0, 3).map((sub, idx) => (
                    <span key={sub.id} className="truncate">
                      {sub.label}
                      {idx < Math.min(mod.subFeatures.length, 3) - 1 && ' • '}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Plugins Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Puzzle className="size-4.5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground">Plugins</h2>
              <p className="text-xs text-muted-foreground">Productivity, integrations, and extensible tools.</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            endIcon={<ArrowRight className="size-3.5" />}
            onClick={() => navigate('/plugins')}
          >
            View all plugins
          </Button>
        </div>

        {activePlugins.length === 0 ? (
          <EmptyState
            icon={
              <IconTile tone="chart-4" size="lg">
                <Puzzle className="size-6" />
              </IconTile>
            }
            title="No plugins activated yet"
            description="Super Admins can activate extensible plugins like Tracura API Logger to add developer logging, telemetry, and platform extensions."
            actions={
              <Button
                variant="primary"
                endIcon={<ArrowRight className="size-4" />}
                onClick={() => navigate('/plugins')}
              >
                Go to Plugins to Activate →
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {activePlugins.map((plugin: CatalogItem) => (
              <div
                key={plugin.id}
                onClick={() => navigate(`/plugins/${plugin.id}`)}
                className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-2xs hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <IconTile tone={plugin.tone} size="lg">
                      {getItemIcon(plugin.id)}
                    </IconTile>
                    <div className="flex size-7 items-center justify-center rounded-full bg-muted/50 text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <ChevronRight className="size-4" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                    {plugin.name}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {plugin.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-border/60 flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
                  {plugin.subFeatures.slice(0, 3).map((sub, idx) => (
                    <span key={sub.id} className="truncate">
                      {sub.label}
                      {idx < Math.min(plugin.subFeatures.length, 3) - 1 && ' • '}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3-Column Widgets Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Widget 1: Recent Activity */}
        <WidgetCard
          title="Recent activity"
          icon={<Activity className="size-4 text-primary" />}
          viewAll={{ label: 'View all', onClick: () => {} }}
        >
          <ActivityFeed items={recentActivityItems} />
        </WidgetCard>

        {/* Widget 2: Favorites */}
        <WidgetCard
          title="Favorites"
          icon={<Star className="size-4 text-amber-500" />}
          viewAll={{ label: 'Manage', onClick: () => {} }}
        >
          <ActionList items={favoritesList} />
        </WidgetCard>

        {/* Widget 3: Announcements */}
        <WidgetCard
          title="Announcements"
          icon={<CheckCircle2 className="size-4 text-primary" />}
          viewAll={{ label: 'View all', onClick: () => {} }}
        >
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-2.5 rounded-lg border border-border/70 bg-muted/20">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileCode2 className="size-4" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">System Update</span>
                  <Badge variant="default" className="text-[10px] py-0 px-1.5">NEW</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2">
                  Platform v1.2.0 is now live with separated business modules and extensible plugins.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-lg border border-border/70 bg-muted/20">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                <AlertTriangle className="size-4" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <span className="text-xs font-semibold text-foreground">Maintenance Window</span>
                <p className="text-[11px] text-muted-foreground line-clamp-2">
                  Scheduled database maintenance on Sunday 02:00 UTC. Zero downtime expected.
                </p>
              </div>
            </div>
          </div>
        </WidgetCard>
      </section>
    </div>
  );
}
