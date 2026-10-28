'use client';

import { useState } from 'react';
import {
  SplitPane,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  TreeView,
  TreeNode,
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  toast,
} from '@innostes/ui';
import {
  Users,
  Building,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Search,
  ChevronRight,
} from 'lucide-react';
import { NORTHWIND_EMPLOYEES, Employee } from '../_data/northwind';

const DEPARTMENT_TREE: TreeNode[] = [
  {
    id: 'all',
    label: 'All Departments (34)',
    children: [
      {
        id: 'supply-chain',
        label: 'Supply Chain & Logistics',
        meta: <Badge variant="secondary">14</Badge>,
      },
      {
        id: 'qa',
        label: 'Quality Assurance',
        meta: <Badge variant="secondary">6</Badge>,
      },
      {
        id: 'procurement',
        label: 'Procurement',
        meta: <Badge variant="secondary">4</Badge>,
      },
      {
        id: 'finance',
        label: 'Finance & Accounts',
        meta: <Badge variant="secondary">9</Badge>,
      },
      {
        id: 'operations',
        label: 'Operations & Warehousing',
        meta: <Badge variant="secondary">11</Badge>,
      },
    ],
  },
];

export default function EmployeeDirectoryExample() {
  const [selectedEmpId, setSelectedEmpId] = useState<string>(NORTHWIND_EMPLOYEES[0].id);
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const selectedEmployee =
    NORTHWIND_EMPLOYEES.find((e) => e.id === selectedEmpId) || NORTHWIND_EMPLOYEES[0];

  const handleSelectEmployee = (id: string) => {
    setSelectedEmpId(id);
    setMobileSheetOpen(true);
  };

  const filteredEmployees = NORTHWIND_EMPLOYEES.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.role.toLowerCase().includes(search.toLowerCase()) ||
      emp.department.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const EmployeeProfile = ({ emp }: { emp: Employee }) => (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 text-lg font-bold">
            <AvatarFallback>{getInitials(emp.name)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">{emp.name}</h2>
              <Badge variant={emp.status === 'active' ? 'default' : 'secondary'}>
                {emp.status === 'active' ? 'Active' : 'On Leave'}
              </Badge>
            </div>
            <p className="text-sm font-medium text-muted-foreground mt-0.5">{emp.role}</p>
            <p className="text-xs text-muted-foreground">{emp.id} • {emp.department}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => toast(`Initiating email to ${emp.email}`)}>
            <Mail className="h-4 w-4 mr-1.5" />
            Email
          </Button>
          <Button variant="primary" size="sm" onClick={() => toast(`Editing profile for ${emp.name}`)}>
            Edit profile
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              Organizational Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="text-xs text-muted-foreground block">Department</span>
              <span className="font-medium text-foreground">{emp.department}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Zonal Base Location</span>
              <span className="font-medium text-foreground flex items-center gap-1.5 mt-0.5">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                {emp.location}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Direct Personnel Reports</span>
              <span className="font-medium text-foreground">{emp.directReportsCount} associates</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="text-xs text-muted-foreground block">Official Email</span>
              <span className="font-mono text-xs text-foreground">{emp.email}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Mobile / WhatsApp</span>
              <span className="font-medium text-foreground">{emp.phone}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Tenure Start Date</span>
              <span className="font-medium text-foreground flex items-center gap-1.5 mt-0.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                {emp.joinDate}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      <div className="hidden lg:block h-[640px]">
        {/* Desktop: SplitPane master-detail */}
        <SplitPane defaultSize={34} minSize={20} maxSize={50} orientation="horizontal" className="h-full">
          <div className="border-r flex flex-col bg-muted/5 h-full overflow-hidden">
            <div className="p-4 border-b space-y-3">
              <h3 className="font-bold text-base text-foreground">Personnel directory</h3>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter associates..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="p-3 border-b">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2 px-1">
                Departments
              </span>
              <TreeView
                aria-label="Department hierarchy"
                items={DEPARTMENT_TREE}
                defaultExpanded={['all']}
                selected={selectedDept}
                onSelectedChange={(id) => setSelectedDept(id)}
              />
            </div>

            <div className="overflow-y-auto flex-1 divide-y" role="listbox" aria-label="Northwind employees">
              {filteredEmployees.map((emp) => (
                <div
                  key={emp.id}
                  role="option"
                  aria-selected={emp.id === selectedEmpId}
                  tabIndex={0}
                  onClick={() => setSelectedEmpId(emp.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedEmpId(emp.id);
                    }
                  }}
                  className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                    emp.id === selectedEmpId
                      ? 'bg-accent/40 border-l-4 border-l-primary'
                      : 'hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 text-xs">
                      <AvatarFallback>{getInitials(emp.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-sm text-foreground">{emp.name}</div>
                      <div className="text-xs text-muted-foreground">{emp.role}</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-y-auto h-full">
            <EmployeeProfile emp={selectedEmployee} />
          </div>
        </SplitPane>
      </div>

      {/* Mobile view: list cards + Sheet overlay */}
      <div className="lg:hidden p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-foreground">Personnel directory</h3>
          <Badge variant="outline">{filteredEmployees.length} associates</Badge>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search personnel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="space-y-2">
          {filteredEmployees.map((emp) => (
            <Card
              key={emp.id}
              tabIndex={0}
              role="button"
              onClick={() => handleSelectEmployee(emp.id)}
              className="p-3 cursor-pointer hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 text-xs">
                    <AvatarFallback>{getInitials(emp.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-sm text-foreground">{emp.name}</div>
                    <div className="text-xs text-muted-foreground">{emp.role}</div>
                  </div>
                </div>
                <Badge variant={emp.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                  {emp.status === 'active' ? 'Active' : 'Leave'}
                </Badge>
              </div>
            </Card>
          ))}
        </div>

        <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
          <SheetContent side="right" className="w-full sm:max-w-xl p-0">
            <SheetHeader className="p-6 border-b">
              <SheetTitle>Associate profile</SheetTitle>
              <SheetDescription>Inspect organizational details and contact channels.</SheetDescription>
            </SheetHeader>
            <EmployeeProfile emp={selectedEmployee} />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
