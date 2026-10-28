import React, { useState, useMemo } from 'react';
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
import {
  LayoutGrid,
  Users,
  Building2,
  CheckCircle2,
  ArrowRight,
  Power,
  PowerOff,
  Filter,
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { useModules } from '../context/ModulesContext';
import type { CatalogItem } from '../catalog';

function getModuleIcon(id: string) {
  switch (id) {
    case 'hrms':
      return <Users className="size-5" />;
    case 'crm':
      return <Building2 className="size-5" />;
    default:
      return <LayoutGrid className="size-5" />;
  }
}

export function ModulesManagerPage() {
  const { navigate } = useNavigation();
  const { allModules, isModuleActive, activateModule, deactivateModule } = useModules();
  const [query, setQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'inactive'>('all');
  const [mutatingId, setMutatingId] = useState<string | null>(null);

  const filteredModules = useMemo(() => {
    return allModules.filter((mod) => {
      const active = isModuleActive(mod.id);
      if (filterTab === 'active' && !active) return false;
      if (filterTab === 'inactive' && active) return false;

      if (!query.trim()) return true;
      const q = query.toLowerCase();
      const inName = mod.name.toLowerCase().includes(q);
      const inDesc = mod.description.toLowerCase().includes(q);
      const inTags = mod.subFeatures.some((f) => f.label.toLowerCase().includes(q));
      return inName || inDesc || inTags;
    });
  }, [allModules, isModuleActive, filterTab, query]);

  async function handleToggle(mod: CatalogItem) {
    const active = isModuleActive(mod.id);
    setMutatingId(mod.id);
    try {
      if (active) {
        await deactivateModule(mod.id);
      } else {
        await activateModule(mod.id);
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
            <BreadcrumbLink onClick={() => navigate('/')} className="cursor-pointer">
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Modules</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <LayoutGrid className="size-6 text-primary" />
            Business Modules
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse, activate, and manage modular business applications for your organization.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <SearchInput
            placeholder="Search business modules..."
            value={query}
            onValueChange={setQuery}
          />
        </div>

        <Tabs value={filterTab} onValueChange={(val) => setFilterTab(val as 'all' | 'active' | 'inactive')}>
          <TabsList>
            <TabsTab value="all">All Modules</TabsTab>
            <TabsTab value="active">Active</TabsTab>
            <TabsTab value="inactive">Inactive</TabsTab>
          </TabsList>
        </Tabs>
      </div>

      {/* Modules List / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredModules.map((mod) => {
          const active = isModuleActive(mod.id);
          const isPending = mutatingId === mod.id;

          return (
            <div
              key={mod.id}
              className="flex flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-2xs hover:shadow-xs transition-shadow"
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <IconTile tone={mod.tone} size="lg">
                      {getModuleIcon(mod.id)}
                    </IconTile>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-foreground">{mod.name}</h2>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          v{mod.version}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Modular Business Package
                      </p>
                    </div>
                  </div>

                  <Badge variant={active ? 'success' : 'secondary'} dot={active}>
                    {active ? 'ACTIVE' : 'INACTIVE'}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                  {mod.description}
                </p>

                {/* Sub Features */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {mod.subFeatures.map((feat) => (
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
                  startIcon={active ? <PowerOff className="size-3.5" /> : <Power className="size-3.5" />}
                  onClick={() => void handleToggle(mod)}
                >
                  {active ? 'Deactivate' : 'Activate Module'}
                </Button>

                {active && (
                  <Button
                    variant="ghost"
                    size="sm"
                    endIcon={<ArrowRight className="size-3.5" />}
                    onClick={() => navigate(`/modules/${mod.id}`)}
                  >
                    Open Module
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredModules.length === 0 && (
        <div className="py-12 text-center text-muted-foreground text-sm">
          No modules match your current search and filter criteria.
        </div>
      )}
    </div>
  );
}
