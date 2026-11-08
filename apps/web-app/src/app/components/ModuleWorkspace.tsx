import type { ReactNode } from 'react';
import { Button, EmptyState, IconTile } from '@innostes/ui';
import { ArrowLeft, Power } from 'lucide-react';
import { Link } from '../context/NavigationContext';
import { useModules } from '../context/ModulesContext';
import { BUSINESS_MODULES_CATALOG } from '../catalog';
import { paths } from '../navigation/routes';
import { appIcon, pageIcon } from '../navigation/icons';
import { NotFoundPage } from './NotFoundPage';
import { PeopleOpsDashboard } from '../modules/peopleops/PeopleOpsDashboard';
import { SalesFlowDashboard } from '../modules/salesflow/SalesFlowDashboard';
import { HireFlowDashboard } from '../modules/hireflow/HireFlowDashboard';
import { LedgerFlowDashboard } from '../modules/ledgerflow/LedgerFlowDashboard';
import { StockFlowDashboard } from '../modules/stockflow/StockFlowDashboard';
import { SprintFlowDashboard } from '../modules/sprintflow/SprintFlowDashboard';
import { DocFlowDashboard } from '../modules/docflow/DocFlowDashboard';

/** Modules whose pages are all implemented (every sub-page renders real UI). */
const FULL_MODULES: Record<string, (subId: string) => ReactNode> = {
  peopleops: (subId) => <PeopleOpsDashboard activeSubFeatureId={subId} />,
};

/** Modules that so far only implement their dashboard (preview with sample data). */
const DASHBOARDS: Record<string, () => ReactNode> = {
  salesflow: () => <SalesFlowDashboard />,
  hireflow: () => <HireFlowDashboard />,
  ledgerflow: () => <LedgerFlowDashboard />,
  stockflow: () => <StockFlowDashboard />,
  sprintflow: () => <SprintFlowDashboard />,
  docflow: () => <DocFlowDashboard />,
};

export function ModuleWorkspace({ moduleId, subId }: { moduleId: string; subId?: string }) {
  const { isModuleActive, activateModule } = useModules();
  const module = BUSINESS_MODULES_CATALOG.find((m) => m.id === moduleId);
  if (!module) return <NotFoundPage />;

  const firstSubId = module.subFeatures[0]?.id ?? 'dashboard';
  const activeSubId = subId ?? firstSubId;
  const sub = module.subFeatures.find((s) => s.id === activeSubId);
  if (!sub) return <NotFoundPage />;

  const Icon = appIcon(module.id);

  if (!isModuleActive(moduleId)) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center px-4 py-16">
        <EmptyState
          icon={
            <IconTile tone="primary" size="lg">
              <Icon />
            </IconTile>
          }
          title={`${module.name} is not active`}
          description="This module hasn't been activated for your organization yet. Administrators can activate it in one step."
          actions={
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="secondary" nativeButton={false} render={<Link href={paths.modules} />}>
                Back to modules
              </Button>
              <Button startIcon={<Power />} onClick={() => void activateModule(moduleId)}>
                Activate {module.name}
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  const full = FULL_MODULES[moduleId];
  if (full) return <>{full(activeSubId)}</>;

  if (activeSubId === firstSubId && DASHBOARDS[moduleId]) return <>{DASHBOARDS[moduleId]()}</>;

  const SubIcon = pageIcon(sub.id);
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center px-4 py-16">
      <EmptyState
        icon={
          <IconTile tone="primary" size="lg">
            <SubIcon />
          </IconTile>
        }
        title={`${sub.label} is coming soon`}
        description={sub.description}
        actions={
          <Button variant="secondary" startIcon={<ArrowLeft />} nativeButton={false} render={<Link href={paths.module(module.id)} />}>
            {module.name} dashboard
          </Button>
        }
      />
    </div>
  );
}
