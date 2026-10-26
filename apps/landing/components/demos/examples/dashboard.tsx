'use client';

import {
  AppRail,
  AppRailItem,
  AppRailHeader,
  AppRailFooter,
  AppSwitcher,
  NotificationBell,
  UserMenu,
  WelcomeBanner,
  EntityList,
  ActivityFeed,
  QuickActions,
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarProvider,
  SidebarTrigger,
  Tabs,
  TabsList,
  TabsTab,
  toast,
  WidgetCard,
  TopBar,
  TopBarStart,
  TopBarCenter,
  TopBarEnd,
  type DataTableColumn,
} from '@innostes/ui';
import { BarChart } from '@innostes/ui/charts';
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
  LayoutDashboard,
  UsersRound,
  Banknote,
  Clock,
  ChevronRight,
  Briefcase,
  Building,
  Cake,
  Calendar,
  MoreVertical,
  Activity,
  HeartHandshake,
} from 'lucide-react';
import {
  money,
  orders,
  shortDate,
  statusTone,
  type Order,
} from '../data-display/data-table/data';

const nav = [
  { label: 'Dashboard', icon: <LayoutDashboard />, active: true },
  {
    label: 'Employees',
    icon: <UsersRound />,
    subItems: [
      { label: 'Directory', href: '#' },
      { label: 'Org Chart', href: '#' },
    ],
  },
  { label: 'Payroll', icon: <Banknote /> },
  { label: 'Attendance', icon: <Clock /> },
  { label: 'Reports', icon: <BarChart3 /> },
];

const birthdays = [
  {
    id: '1',
    title: 'Alex Smith',
    subtitle: 'Engineering',
    meta: 'Today',
    icon: <Cake className="size-4" />,
    tone: 'primary' as const,
  },
  {
    id: '2',
    title: 'Sarah Jenkins',
    subtitle: 'Design',
    meta: 'Tomorrow',
    icon: <Cake className="size-4" />,
    tone: 'chart-2' as const,
  },
  {
    id: '3',
    title: 'Michael Chen',
    subtitle: 'Sales',
    meta: 'In 3 days',
    icon: <Cake className="size-4" />,
    tone: 'chart-3' as const,
  },
];

const activities = [
  {
    id: '1',
    title: 'Performance Review Completed',
    description: 'Q3 review for Alex Smith was completed by Jane Doe.',
    time: '2 hours ago',
    icon: <Activity className="size-4" />,
    tone: 'chart-4' as const,
  },
  {
    id: '2',
    title: 'New Hire Onboarded',
    description: 'Sarah Jenkins joined the Design team.',
    time: '4 hours ago',
    icon: <HeartHandshake className="size-4" />,
    tone: 'primary' as const,
  },
  {
    id: '3',
    title: 'Payroll Processed',
    description: 'October payroll has been successfully processed.',
    time: '1 day ago',
    icon: <Banknote className="size-4" />,
    tone: 'chart-1' as const,
  },
];

const quickActions = [
  {
    id: '1',
    label: 'Add Employee',
    description: 'Onboard a new team member',
    icon: <Plus className="size-4" />,
    onClick: () => toast('Add Employee'),
  },
  {
    id: '2',
    label: 'Run Payroll',
    description: 'Process current pay period',
    icon: <Banknote className="size-4" />,
    onClick: () => toast('Run Payroll'),
  },
  {
    id: '3',
    label: 'Time Off Request',
    description: 'Submit or approve leave',
    icon: <Clock className="size-4" />,
    onClick: () => toast('Time Off Request'),
  },
];

const headcountData = [
  { department: 'Engineering', count: 45 },
  { department: 'Sales', count: 32 },
  { department: 'Marketing', count: 18 },
  { department: 'Design', count: 12 },
  { department: 'HR', count: 8 },
];

export default function DashboardExample() {
  return (
    <div className="min-h-0 h-[56rem] w-full overflow-hidden rounded-lg border border-border flex text-start bg-background">
      <AppRail>
        <AppRailHeader>
          <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
            I
          </div>
        </AppRailHeader>
        <AppRailItem label="Home" isActive icon={<Home className="size-5" />} />
        <AppRailItem
          label="Organization"
          icon={<Building className="size-5" />}
        />
        <AppRailItem
          label="Recruitment"
          icon={<Briefcase className="size-5" />}
        />
        <AppRailFooter>
          <AppRailItem
            label="Settings"
            icon={<Settings className="size-5" />}
          />
        </AppRailFooter>
      </AppRail>

      <SidebarProvider>
        <Sidebar
          variant="sidebar"
          collapsible="icon"
          className="h-full border-r border-border bg-sidebar"
        >
          <SidebarHeader>
            <div className="flex h-9 items-center gap-2 overflow-hidden px-1.5">
              <span className="truncate text-sm font-semibold">
                Innostes HR
              </span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Main</SidebarGroupLabel>
              <SidebarMenu>
                {nav.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    {item.subItems ? (
                      <>
                        <SidebarMenuButton
                          icon={item.icon}
                          isActive={item.active}
                        >
                          <span className="flex-1">{item.label}</span>
                          <ChevronRight className="size-4 opacity-50" />
                        </SidebarMenuButton>
                        <SidebarMenuSub>
                          {item.subItems.map((sub) => (
                            <SidebarMenuSubItem key={sub.label}>
                              <SidebarMenuSubButton href={sub.href}>
                                {sub.label}
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </>
                    ) : (
                      <SidebarMenuButton
                        icon={item.icon}
                        isActive={item.active}
                      >
                        {item.label}
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="@container overflow-y-auto">
          <TopBar>
            <TopBarStart>
              <SidebarTrigger className="-ms-2" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage>Dashboard</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </TopBarStart>
            <TopBarEnd>
              <AppSwitcher
                sections={[
                  {
                    label: 'Modules',
                    apps: [
                      { id: 'hr', name: 'HRMS', icon: <UsersRound /> },
                      { id: 'finance', name: 'Finance', icon: <Banknote /> },
                    ],
                  },
                ]}
                defaultValue="hr"
              />
              <NotificationBell items={[]} />
              <UserMenu name="Ada Lovelace" subtitle="Admin" />
            </TopBarEnd>
          </TopBar>

          <main className="flex flex-col gap-6 p-4 @3xl:p-6">
            <WelcomeBanner
              title="Good morning, Ada!"
              description="Here is what's happening in your organization today."
              actions={
                <Button
                  startIcon={<Plus />}
                  onClick={() => toast('New hire initiated')}
                >
                  Onboard employee
                </Button>
              }
            />

            <MetricGrid>
              <MetricCard
                label="Total Headcount"
                value="115"
                icon={<UsersRound />}
                tone="chart-1"
                delta={0.05}
                comparison="vs last month"
              />
              <MetricCard
                label="Open Roles"
                value="12"
                icon={<Briefcase />}
                tone="chart-2"
                delta={-0.15}
                upIsGood={false}
                comparison="vs last month"
              />
              <MetricCard
                label="Time Off Requests"
                value="8"
                icon={<Calendar />}
                tone="chart-5"
                delta={0.2}
                upIsGood={false}
                comparison="vs last month"
              />
              <MetricCard
                label="Payroll Variance"
                value="+2.4%"
                icon={<Banknote />}
                tone="chart-3"
                delta={0.024}
                comparison="vs last month"
              />
            </MetricGrid>

            <div className="grid gap-4 @4xl:grid-cols-2 @6xl:grid-cols-3">
              <WidgetCard
                title="Headcount by Department"
                className="@6xl:col-span-2 min-h-[20rem]"
              >
                <BarChart
                  aria-label="Headcount by Department"
                  data={headcountData}
                  categoryKey="department"
                  series={[{ key: 'count', label: 'Count', color: 'primary' }]}
                  valueAxisWidth={30}
                  className="h-64"
                />
              </WidgetCard>

              <WidgetCard title="Quick Actions" className="h-full">
                <QuickActions items={quickActions} />
              </WidgetCard>
            </div>

            <div className="grid gap-4 @4xl:grid-cols-2">
              <WidgetCard title="Upcoming Birthdays" viewAll={{ href: '#' }}>
                <EntityList items={birthdays} density="sm" />
              </WidgetCard>

              <WidgetCard title="Recent Activity" viewAll={{ href: '#' }}>
                <ActivityFeed items={activities} />
              </WidgetCard>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
