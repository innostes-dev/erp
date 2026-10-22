'use client';

import { Badge, Tabs, TabsList, TabsPanel, TabsTab } from '@innostes/ui';

export default function TabsDemo() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-10">
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTab value="overview">Overview</TabsTab>
          <TabsTab value="orders">
            Orders{' '}
            <Badge size="sm" variant="secondary">
              12
            </Badge>
          </TabsTab>
          <TabsTab value="invoices">Invoices</TabsTab>
          <TabsTab value="audit" disabled>
            Audit log
          </TabsTab>
        </TabsList>
        <TabsPanel value="overview" className="text-sm text-muted-foreground">
          Customer since March 2024. Net 30 payment terms.
        </TabsPanel>
        <TabsPanel value="orders" className="text-sm text-muted-foreground">
          12 orders in the last 90 days.
        </TabsPanel>
        <TabsPanel value="invoices" className="text-sm text-muted-foreground">
          All invoices are paid.
        </TabsPanel>
      </Tabs>

      <Tabs defaultValue="month" variant="pills">
        <TabsList>
          <TabsTab value="week">Week</TabsTab>
          <TabsTab value="month">Month</TabsTab>
          <TabsTab value="year">Year</TabsTab>
        </TabsList>
      </Tabs>
    </div>
  );
}
