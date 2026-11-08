import { useMemo, useState } from 'react';
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  PageHeader,
  SearchInput,
  Tabs,
  TabsList,
  TabsTab,
} from '@innostes/ui';
import { Search } from 'lucide-react';
import { Link } from '../context/NavigationContext';
import type { CatalogItem } from '../catalog';
import { AppCard } from './AppCard';

type Filter = 'all' | 'active' | 'inactive';

export interface CatalogPageProps {
  /** "module" or "plugin": used in copy. */
  noun: 'module' | 'plugin';
  title: string;
  description: string;
  items: CatalogItem[];
  isActive: (id: string) => boolean;
  activate: (id: string) => Promise<void>;
  deactivate: (id: string) => Promise<void>;
  canManage: boolean;
  hrefFor: (id: string) => string;
}

/** Shared catalog for modules and plugins: search, filter, activate, deactivate (confirmed). */
export function CatalogPage({
  noun,
  title,
  description,
  items,
  isActive,
  activate,
  deactivate,
  canManage,
  hrefFor,
}: CatalogPageProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<CatalogItem | null>(null);

  const activeCount = items.filter((i) => isActive(i.id)).length;
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const active = isActive(item.id);
      if (filter === 'active' && !active) return false;
      if (filter === 'inactive' && active) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.subFeatures.some((f) => f.label.toLowerCase().includes(q))
      );
    });
  }, [items, isActive, filter, query]);

  async function run(id: string, action: (id: string) => Promise<void>) {
    setPendingId(id);
    try {
      await action(id);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <>
      <PageHeader title={title} description={description} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          aria-label={`Search ${noun}s`}
          placeholder={`Search ${noun}s…`}
          value={query}
          onValueChange={setQuery}
          className="w-full sm:w-80"
        />
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList aria-label={`Filter ${noun}s`}>
            <TabsTab value="all">All · {items.length}</TabsTab>
            <TabsTab value="active">Active · {activeCount}</TabsTab>
            <TabsTab value="inactive">Inactive · {items.length - activeCount}</TabsTab>
          </TabsList>
        </Tabs>
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border-strong bg-card px-6 py-12 text-center">
          <Search className="size-5 text-subtle-foreground" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground">No {noun}s match your search</p>
          <p className="text-body-sm text-muted-foreground">Try another keyword or clear the filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {visible.map((item) => {
            const active = isActive(item.id);
            return (
              <AppCard
                key={item.id}
                item={item}
                status={
                  <Badge variant={active ? 'success' : 'secondary'} dot>
                    {active ? 'Active' : 'Inactive'}
                  </Badge>
                }
                actions={
                  <>
                    {active && (
                      <Button size="sm" nativeButton={false} render={<Link href={hrefFor(item.id)} />}>
                        Open
                      </Button>
                    )}
                    {canManage ? (
                      active ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          loading={pendingId === item.id}
                          onClick={() => setConfirming(item)}
                        >
                          Deactivate
                        </Button>
                      ) : (
                        <Button size="sm" loading={pendingId === item.id} onClick={() => void run(item.id, activate)}>
                          Activate
                        </Button>
                      )
                    ) : (
                      !active && <span className="self-center text-body-sm text-muted-foreground">Ask an administrator to activate</span>
                    )}
                  </>
                }
              />
            );
          })}
        </div>
      )}

      <AlertDialog open={confirming !== null} onOpenChange={(open) => !open && setConfirming(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate {confirming?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              People in your organization will lose access to {confirming?.name} until it's activated again.
              Your data is kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="secondary" />}>Cancel</AlertDialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                const item = confirming;
                setConfirming(null);
                if (item) void run(item.id, deactivate);
              }}
            >
              Deactivate
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
