import {
  ActionList,
  Badge,
  Button,
  EmptyState,
  IconTile,
  PageHeader,
  WidgetCard,
} from '@innostes/ui';
import { useAuth } from '@innostes/kernel';
import { KeyRound, LayoutGrid, Puzzle, Search, ShieldCheck } from 'lucide-react';
import { Link } from '../context/NavigationContext';
import { useModules } from '../context/ModulesContext';
import { usePlugins } from '../context/PluginsContext';
import { useCurrentTenant } from '../context/TenantContext';
import { paths } from '../navigation/routes';
import { AppCard } from './AppCard';

function greeting(date: Date) {
  const h = date.getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

/** Home: the user's applications, workspace status and shortcuts. Real data only. */
export function EcosystemHome() {
  const { user } = useAuth();
  const { activeModules, allModules } = useModules();
  const { activePlugins, allPlugins } = usePlugins();
  const { tenantName } = useCurrentTenant();

  const now = new Date();
  const today = new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now);
  const name = user?.first_name?.trim();

  return (
    <>
      <PageHeader
        title={name ? `${greeting(now)}, ${name}` : greeting(now)}
        description={`${today} · ${tenantName}`}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-6 xl:col-span-2">
          <Section
            title="Business modules"
            description="Applications your organization runs on."
            link={{ href: paths.modules, label: 'All modules' }}
          >
            {activeModules.length === 0 ? (
              <EmptyState
                icon={<IconTile tone="neutral" size="lg"><LayoutGrid /></IconTile>}
                title="No modules activated yet"
                description="Activate modules such as PeopleOps or SalesFlow to start running your business on INNOSTES."
                actions={
                  <Button nativeButton={false} render={<Link href={paths.modules} />}>
                    Browse modules
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                {activeModules.map((mod) => (
                  <AppCard key={mod.id} item={mod} href={paths.module(mod.id)} />
                ))}
              </div>
            )}
          </Section>

          <Section
            title="Tools"
            description="Plugins that extend the platform."
            link={{ href: paths.plugins, label: 'All plugins' }}
          >
            {activePlugins.length === 0 ? (
              <EmptyState
                icon={<IconTile tone="neutral" size="lg"><Puzzle /></IconTile>}
                title="No tools activated yet"
                description="Add tools such as Tracura for API telemetry from the plugin catalog."
                actions={
                  <Button variant="secondary" nativeButton={false} render={<Link href={paths.plugins} />}>
                    Browse plugins
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                {activePlugins.map((plugin) => (
                  <AppCard key={plugin.id} item={plugin} href={paths.plugin(plugin.id)} />
                ))}
              </div>
            )}
          </Section>
        </div>

        <aside className="flex flex-col gap-6" aria-label="Workspace">
          <WidgetCard title="Workspace">
            <dl className="divide-y divide-border text-body-sm">
              <SummaryRow label="Organization" value={tenantName} />
              <SummaryRow label="Modules active" value={`${activeModules.length} of ${allModules.length}`} />
              <SummaryRow label="Tools active" value={`${activePlugins.length} of ${allPlugins.length}`} />
              <SummaryRow
                label="Your access"
                value={user?.is_super_admin ? <Badge variant="primary">Super admin</Badge> : <Badge variant="secondary">Member</Badge>}
              />
            </dl>
          </WidgetCard>

          <WidgetCard title="Quick actions">
            <ActionList
              items={[
                {
                  id: 'search',
                  title: 'Find anything',
                  description: 'Jump to any module or page with Ctrl K',
                  icon: <Search />,
                  tone: 'neutral',
                },
                {
                  id: 'modules',
                  title: 'Manage modules',
                  description: 'Activate or retire business modules',
                  icon: <LayoutGrid />,
                  tone: 'neutral',
                  action: { label: 'Open', render: <Link href={paths.modules} /> },
                },
                {
                  id: 'audit',
                  title: 'Review audit trail',
                  description: 'Who changed what, and when',
                  icon: <ShieldCheck />,
                  tone: 'neutral',
                  action: { label: 'Open', render: <Link href={paths.audit} /> },
                },
                {
                  id: 'keys',
                  title: 'API keys',
                  description: 'Connect integrations securely',
                  icon: <KeyRound />,
                  tone: 'neutral',
                  action: { label: 'Open', render: <Link href={paths.apiKeys} /> },
                },
              ]}
            />
          </WidgetCard>
        </aside>
      </div>
    </>
  );
}

function Section({
  title,
  description,
  link,
  children,
}: {
  title: string;
  description: string;
  link: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4" aria-label={title}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-subheading font-semibold text-foreground">{title}</h2>
          <p className="text-body-sm text-muted-foreground">{description}</p>
        </div>
        <Link
          href={link.href}
          className="shrink-0 rounded-sm text-body-sm font-medium text-primary hover:text-primary-hover hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {link.label}
        </Link>
      </div>
      {children}
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium text-foreground tabular">{value}</dd>
    </div>
  );
}
