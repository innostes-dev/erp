'use client';

import {
  Avatar,
  AvatarFallback,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  Button,
  DataTable,
  Meter,
  MetricCard,
  MetricGrid,
  PageHeader,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  Tabs,
  TabsList,
  TabsTab,
  toast,
  WidgetCard,
  type DataTableColumn,
} from '@innostes/ui';
import {
  BarChart3,
  Boxes,
  Download,
  FileText,
  Home,
  Plus,
  Settings,
  ShoppingCart,
  Users,
  Euro,
  RotateCcw,
} from 'lucide-react';
import {
  money,
  orders,
  shortDate,
  statusTone,
  type Order,
} from '../data-display/data-table/data';

const columns: DataTableColumn<Order>[] = [
  {
    id: 'id',
    header: 'Order',
    accessor: (o) => o.id,
    sortable: true,
    cell: (o) => <span className="font-medium">{o.id}</span>,
  },
  {
    id: 'customer',
    header: 'Customer',
    accessor: (o) => o.customer,
    sortable: true,
  },
  {
    id: 'status',
    header: 'Status',
    accessor: (o) => o.status,
    cell: (o) => (
      <Badge variant={statusTone[o.status]} dot>
        {o.status}
      </Badge>
    ),
  },
  {
    id: 'date',
    header: 'Date',
    accessor: (o) => o.date,
    sortable: true,
    cell: (o) => shortDate.format(o.date),
  },
  {
    id: 'total',
    header: 'Total',
    accessor: (o) => o.total,
    sortable: true,
    align: 'end',
    cell: (o) => money.format(o.total),
  },
];

const nav = [
  { label: 'Dashboard', icon: <Home />, active: true },
  { label: 'Orders', icon: <ShoppingCart /> },
  { label: 'Invoices', icon: <FileText /> },
  { label: 'Customers', icon: <Users /> },
  { label: 'Products', icon: <Boxes /> },
  { label: 'Reports', icon: <BarChart3 /> },
];

export default function DashboardExample() {
  return (
    <SidebarProvider className="min-h-0 h-[56rem] w-full overflow-hidden rounded-lg border border-border text-start">
      <Sidebar className="h-full">
        <SidebarHeader>
          <div className="flex h-9 items-center gap-2 overflow-hidden px-1.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
              A
            </span>
            <span className="truncate text-sm font-semibold">Acme Inc.</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarMenu>
              {nav.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton icon={item.icon} isActive={item.active}>
                    {item.label}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
          <SidebarGroup className="mt-auto">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton icon={<Settings />}>
                  Settings
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <SidebarInset className="@container overflow-y-auto">
        <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 border-b border-border bg-background px-3">
          <SidebarTrigger />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Avatar size="sm" className="ms-auto">
            <AvatarFallback>AL</AvatarFallback>
          </Avatar>
        </header>

        <main className="flex flex-col gap-6 p-4 @3xl:p-6">
          <PageHeader
            title="Good morning, Ada"
            description="Here's what's happening with your store today."
            actions={
              <>
                <Button
                  variant="outline"
                  startIcon={<Download />}
                  onClick={() => toast.success('Report exported')}
                >
                  Export
                </Button>
                <Button startIcon={<Plus />} onClick={() => toast('New order')}>
                  New order
                </Button>
              </>
            }
          />

          <Tabs defaultValue="30d" variant="pills">
            <TabsList>
              <TabsTab value="7d">7 days</TabsTab>
              <TabsTab value="30d">30 days</TabsTab>
              <TabsTab value="12m">12 months</TabsTab>
            </TabsList>
          </Tabs>

          <MetricGrid>
            <MetricCard
              label="Revenue"
              value="€48,250"
              icon={<Euro />}
              tone="chart-1"
              delta={0.125}
              comparison="vs previous 30 days"
            />
            <MetricCard
              label="Orders"
              value="1,284"
              icon={<ShoppingCart />}
              tone="chart-2"
              delta={0.041}
              comparison="vs previous 30 days"
            />
            <MetricCard
              label="Refund rate"
              value="1.2%"
              icon={<RotateCcw />}
              tone="chart-5"
              delta={-0.003}
              deltaFormat={{
                style: 'percent',
                maximumFractionDigits: 1,
                signDisplay: 'exceptZero',
              }}
              upIsGood={false}
              comparison="vs previous 30 days"
            />
            <MetricCard
              label="Active customers"
              value="3,912"
              icon={<Users />}
              tone="chart-3"
              delta={0.02}
              comparison="vs previous 30 days"
            />
          </MetricGrid>

          <div className="grid gap-4 @6xl:grid-cols-[1fr_20rem]">
            <WidgetCard
              title="Recent orders"
              viewAll={{ href: '#' }}
              padding="none"
              className="min-w-0"
            >
              <div className="px-5 pb-4">
                <DataTable
                  aria-label="Recent orders"
                  data={orders}
                  columns={columns}
                  getRowId={(o) => o.id}
                  defaultSort={{ columnId: 'date', direction: 'desc' }}
                  selectable
                  pageSize={6}
                />
              </div>
            </WidgetCard>
            <WidgetCard
              title="Plan usage"
              description="Business plan · renews Nov 30"
              className="h-fit"
            >
              <div className="flex flex-col gap-5">
                <Meter value={37} max={50} label="Seats" />
                <Meter
                  value={82}
                  label="Storage"
                  format={{ style: 'unit', unit: 'gigabyte' }}
                  tone="warning"
                />
                <Meter
                  value={0.41}
                  max={1}
                  label="API calls"
                  format={{ style: 'percent' }}
                />
              </div>
            </WidgetCard>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
