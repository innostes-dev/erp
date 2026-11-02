import { useState, useEffect } from 'react';
import {
  AppSwitcher,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  IconTile,
  TopBar,
  TopBarStart,
  TopBarCenter,
  TopBarEnd,
  UserMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  EmptyState,
  Badge,
} from '@innostes/ui';
import { useAuth } from '@innostes/kernel';
import {
  ArrowLeft,
  Building2,
  Users,
  LayoutGrid,
  Power,
  UserCheck,
  Landmark,
  Package,
  CheckSquare,
  BookOpen,
  LayoutDashboard,
  Clock,
  Calendar,
  CreditCard,
  TrendingUp,
  DollarSign,
  Target,
  Briefcase,
  FileText,
  Boxes,
  Layers,
  Sparkles,
  CircleDot,
  Video,
  Award,
  FileCheck,
  Share2,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldAlert,
  BarChart3,
  Building,
  Truck,
  ClipboardCheck,
  Play,
  Kanban,
  AlertCircle,
  Tag,
  LifeBuoy,
  Folder,
  FileSignature,
  ShoppingBag,
  PieChart,
  Globe,
  Contact2,
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { useModules } from '../context/ModulesContext';
import { useCurrentTenant } from '../context/TenantContext';
import { BUSINESS_MODULES_CATALOG } from '../catalog';
import { PeopleOpsDashboard } from '../modules/peopleops/PeopleOpsDashboard';
import { SalesFlowDashboard } from '../modules/salesflow/SalesFlowDashboard';
import { HireFlowDashboard } from '../modules/hireflow/HireFlowDashboard';
import { LedgerFlowDashboard } from '../modules/ledgerflow/LedgerFlowDashboard';
import { StockFlowDashboard } from '../modules/stockflow/StockFlowDashboard';
import { SprintFlowDashboard } from '../modules/sprintflow/SprintFlowDashboard';
import { DocFlowDashboard } from '../modules/docflow/DocFlowDashboard';

interface ModuleShellLayoutProps {
  moduleId: string;
}

export function getModuleIcon(id: string) {
  switch (id) {
    case 'peopleops':
      return <Users className="size-4" />;
    case 'salesflow':
      return <Building2 className="size-4" />;
    case 'hireflow':
      return <UserCheck className="size-4" />;
    case 'ledgerflow':
      return <Landmark className="size-4" />;
    case 'stockflow':
      return <Package className="size-4" />;
    case 'sprintflow':
      return <CheckSquare className="size-4" />;
    case 'docflow':
      return <BookOpen className="size-4" />;
    default:
      return <LayoutGrid className="size-4" />;
  }
}

function getSubFeatureIcon(subId: string) {
  switch (subId) {
    case 'dashboard':
    case 'overview':
      return <LayoutDashboard className="size-4 shrink-0" />;
    case 'employees':
      return <Users className="size-4 shrink-0" />;
    case 'onboarding':
      return <UserCheck className="size-4 shrink-0" />;
    case 'attendance':
      return <Clock className="size-4 shrink-0" />;
    case 'leave':
      return <Calendar className="size-4 shrink-0" />;
    case 'payroll':
      return <CreditCard className="size-4 shrink-0" />;
    case 'performance':
      return <TrendingUp className="size-4 shrink-0" />;
    case 'expenses':
      return <DollarSign className="size-4 shrink-0" />;
    case 'leads':
      return <Target className="size-4 shrink-0" />;
    case 'contacts':
      return <Contact2 className="size-4 shrink-0" />;
    case 'accounts':
      return <Building2 className="size-4 shrink-0" />;
    case 'deals':
      return <Briefcase className="size-4 shrink-0" />;
    case 'quotes':
      return <FileText className="size-4 shrink-0" />;
    case 'orders':
      return <ShoppingBag className="size-4 shrink-0" />;
    case 'analytics':
      return <PieChart className="size-4 shrink-0" />;
    case 'jobs':
      return <Briefcase className="size-4 shrink-0" />;
    case 'candidates':
      return <Users className="size-4 shrink-0" />;
    case 'career-site':
      return <Globe className="size-4 shrink-0" />;
    case 'interviews':
      return <Video className="size-4 shrink-0" />;
    case 'scorecards':
      return <Award className="size-4 shrink-0" />;
    case 'offers':
      return <FileCheck className="size-4 shrink-0" />;
    case 'handoff':
      return <Share2 className="size-4 shrink-0" />;
    case 'coa':
      return <FileSpreadsheet className="size-4 shrink-0" />;
    case 'journals':
      return <BookOpen className="size-4 shrink-0" />;
    case 'ap':
      return <ArrowUpRight className="size-4 shrink-0" />;
    case 'ar':
      return <ArrowDownLeft className="size-4 shrink-0" />;
    case 'watchdog':
      return <ShieldAlert className="size-4 shrink-0" />;
    case 'banking':
      return <Landmark className="size-4 shrink-0" />;
    case 'statements':
      return <BarChart3 className="size-4 shrink-0" />;
    case 'items':
      return <Boxes className="size-4 shrink-0" />;
    case 'warehouses':
      return <Building className="size-4 shrink-0" />;
    case 'receipts':
      return <FileCheck className="size-4 shrink-0" />;
    case 'transfers':
      return <Truck className="size-4 shrink-0" />;
    case 'valuation':
      return <DollarSign className="size-4 shrink-0" />;
    case 'counts':
      return <ClipboardCheck className="size-4 shrink-0" />;
    case 'backlog':
      return <Layers className="size-4 shrink-0" />;
    case 'sprint':
      return <Play className="size-4 shrink-0" />;
    case 'kanban':
      return <Kanban className="size-4 shrink-0" />;
    case 'bugs':
      return <AlertCircle className="size-4 shrink-0" />;
    case 'releases':
      return <Tag className="size-4 shrink-0" />;
    case 'servicedesk':
      return <LifeBuoy className="size-4 shrink-0" />;
    case 'spaces':
      return <Folder className="size-4 shrink-0" />;
    case 'pages':
      return <FileText className="size-4 shrink-0" />;
    case 'sops':
      return <CheckSquare className="size-4 shrink-0" />;
    case 'templates':
      return <Sparkles className="size-4 shrink-0" />;
    case 'meeting-notes':
      return <FileSignature className="size-4 shrink-0" />;
    default:
      return <CircleDot className="size-4 shrink-0" />;
  }
}

export function ModuleShellLayout({ moduleId }: ModuleShellLayoutProps) {
  const { user, logout } = useAuth();
  const { navigate } = useNavigation();
  const { activeModules, isModuleActive, activateModule } = useModules();
  const { tenantName } = useCurrentTenant();

  const currentModule = BUSINESS_MODULES_CATALOG.find((m) => m.id === moduleId);
  const isActive = isModuleActive(moduleId);

  // Sidemenu active item state
  const defaultSub = currentModule?.subFeatures[0]?.id || 'dashboard';
  const [activeSubFeatureId, setActiveSubFeatureId] = useState<string>(defaultSub);

  // Sync active item when moduleId changes
  useEffect(() => {
    if (currentModule?.subFeatures[0]?.id) {
      setActiveSubFeatureId(currentModule.subFeatures[0].id);
    }
  }, [moduleId, currentModule]);

  // Build sections for AppSwitcher
  const appSwitcherSections = [
    {
      label: 'Active Business Modules',
      apps: activeModules.map((mod) => ({
        id: mod.id,
        name: mod.name,
        description: mod.description,
        icon: getModuleIcon(mod.id),
        tone: mod.tone,
        onClick: () => navigate(`/modules/${mod.id}`),
      })),
      viewAll: {
        label: 'Manage all modules',
        onClick: () => navigate('/modules'),
      },
    },
  ];

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Arun';

  function renderModuleDashboard() {
    switch (moduleId) {
      case 'peopleops':
        return <PeopleOpsDashboard />;
      case 'salesflow':
        return <SalesFlowDashboard />;
      case 'hireflow':
        return <HireFlowDashboard />;
      case 'ledgerflow':
        return <LedgerFlowDashboard />;
      case 'stockflow':
        return <StockFlowDashboard />;
      case 'sprintflow':
        return <SprintFlowDashboard />;
      case 'docflow':
        return <DocFlowDashboard />;
      default:
        return (
          <div className="p-8 text-center text-muted-foreground">
            Unknown Module: {moduleId}
          </div>
        );
    }
  }

  const activeSubFeature = currentModule?.subFeatures.find((s) => s.id === activeSubFeatureId);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* 1. Dedicated Business Module Top Bar */}
      <TopBar className="border-b border-border bg-background/95 backdrop-blur z-20">
        <TopBarStart className="gap-3">
          <Button
            variant="ghost"
            size="sm"
            startIcon={<ArrowLeft className="size-4" />}
            onClick={() => navigate('/')}
          >
            Ecosystem
          </Button>

          <div className="h-4 w-px bg-border" />

          {/* App Switcher for active business modules */}
          <AppSwitcher
            value={moduleId}
            sections={appSwitcherSections}
            onValueChange={(chosenId) => navigate(`/modules/${chosenId}`)}
            showName
          />
        </TopBarStart>

        <TopBarCenter className="hidden md:flex">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink onClick={() => navigate('/')} className="cursor-pointer">
                  Ecosystem
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink onClick={() => navigate('/modules')} className="cursor-pointer">
                  Modules
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{currentModule?.name ?? moduleId.toUpperCase()}</BreadcrumbPage>
              </BreadcrumbItem>
              {activeSubFeature && activeSubFeature.id !== 'dashboard' && activeSubFeature.id !== 'overview' && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{activeSubFeature.label}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </TopBarCenter>

        <TopBarEnd className="gap-2">
          <UserMenu
            name={fullName}
            subtitle={tenantName}
            email={user?.email || ''}
            align="end"
          >
            <DropdownMenuItem onClick={() => navigate('/')}>
              Ecosystem Home
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/modules')}>
              All Modules
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/plugins')}>
              Plugins & Tools
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void logout(false)}>
              Sign out
            </DropdownMenuItem>
          </UserMenu>
        </TopBarEnd>
      </TopBar>

      {/* 2. Content Layout */}
      {!isActive ? (
        <main className="flex-1 p-6 md:p-8 max-w-4xl mx-auto w-full flex items-center justify-center">
          <EmptyState
            icon={
              <IconTile tone={currentModule?.tone ?? 'primary'} size="lg">
                {getModuleIcon(moduleId)}
              </IconTile>
            }
            title={`${currentModule?.name ?? moduleId.toUpperCase()} is not active`}
            description="This business module has not been activated for your tenant. Super Admins can activate it with one click."
            actions={
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  startIcon={<Power className="size-4" />}
                  onClick={() => void activateModule(moduleId)}
                >
                  Activate {currentModule?.name}
                </Button>
                <Button variant="outline" onClick={() => navigate('/modules')}>
                  Back to Modules Catalog
                </Button>
              </div>
            }
          />
        </main>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Module Sidemenu Sidebar */}
          <aside className="w-60 border-r border-border bg-sidebar shrink-0 flex flex-col justify-between select-none">
            <div className="p-3">
              {/* Module Header Card */}
              <div className="flex items-center gap-2.5 px-3 py-2.5 mb-3 rounded-xl bg-primary/5 border border-primary/10">
                <IconTile tone={currentModule?.tone ?? 'primary'} size="sm">
                  {getModuleIcon(moduleId)}
                </IconTile>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-foreground truncate">{currentModule?.name}</p>
                    <Badge variant="success" dot className="text-[9px] px-1 py-0">Active</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Business Module</p>
                </div>
              </div>

              {/* Navigation Items */}
              <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground px-3 py-1">
                Navigation
              </div>
              <nav className="flex flex-col gap-0.5 mt-1">
                {currentModule?.subFeatures.map((sub) => {
                  const isSelected = activeSubFeatureId === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setActiveSubFeatureId(sub.id)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                        isSelected
                          ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                          : 'text-foreground/80 hover:text-foreground hover:bg-muted/40'
                      }`}
                    >
                      {getSubFeatureIcon(sub.id)}
                      <span className="truncate flex-1">{sub.label}</span>
                      {isSelected && (
                        <span className="size-1.5 rounded-full bg-current shrink-0" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Sidebar Footer */}
            <div className="p-3 border-t border-border/70 text-[11px] text-muted-foreground bg-muted/10">
              <div className="flex items-center justify-between">
                <span>Release</span>
                <span className="font-mono text-[10px] font-semibold text-foreground">v{currentModule?.version}</span>
              </div>
            </div>
          </aside>

          {/* Main Module Content Area */}
          <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-muted/10">
            <div className="max-w-6xl mx-auto w-full">
              {/* Optional Section Banner if non-dashboard item is clicked */}
              {activeSubFeatureId !== 'dashboard' && activeSubFeatureId !== 'overview' && (
                <div className="mb-5 p-3.5 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">
                      Selected: {activeSubFeature?.label}
                    </span>
                    <span className="text-muted-foreground">• Showing Dashboard view for now. Page builder will follow.</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setActiveSubFeatureId(currentModule?.subFeatures[0]?.id || 'dashboard')}>
                    Reset to Dashboard
                  </Button>
                </div>
              )}

              {/* Render the specialized module dashboard */}
              {renderModuleDashboard()}
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
