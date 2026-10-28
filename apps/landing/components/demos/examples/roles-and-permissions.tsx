'use client';

import { useState } from 'react';
import {
  PermissionMatrix,
  PermissionResource,
  PermissionAction,
  permissionKey,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Button,
  toast,
} from '@innostes/ui';
import { ShieldCheck, Lock, Users, Save, CheckCircle2 } from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  memberCount: number;
  permissions: string[];
}

const SYSTEM_ACTIONS: PermissionAction[] = [
  { id: 'view', label: 'View' },
  { id: 'create', label: 'Create' },
  { id: 'edit', label: 'Edit' },
  { id: 'approve', label: 'Approve' },
  { id: 'delete', label: 'Archive' },
];

const SYSTEM_RESOURCES: PermissionResource[] = [
  {
    id: 'purchase_orders',
    label: 'Purchase orders',
    description: 'Procurement contracts and supplier commitments',
    group: 'Procurement',
  },
  {
    id: 'vendor_invoices',
    label: 'Vendor invoices',
    description: 'Inbound billing and 3-way reconciliation',
    group: 'Finance',
  },
  {
    id: 'stock_transfers',
    label: 'Stock transfers',
    description: 'Inter-warehouse freight and inventory movements',
    group: 'Warehousing',
  },
  {
    id: 'customs_clearance',
    label: 'Customs & port passes',
    description: 'Import gate permits and port logistics',
    group: 'Logistics',
  },
  {
    id: 'tax_filings',
    label: 'Statutory GST filings',
    description: 'GSTR-1, GSTR-3B and e-way bill portals',
    group: 'Compliance',
  },
];

const INITIAL_ROLES: Role[] = [
  {
    id: 'role-procurement',
    name: 'Senior Procurement Officer',
    description: 'Manages vendor relations, RFQs, and purchase order authorizations up to ₹25,00,000.',
    isSystem: false,
    memberCount: 4,
    permissions: [
      permissionKey('purchase_orders', 'view'),
      permissionKey('purchase_orders', 'create'),
      permissionKey('purchase_orders', 'edit'),
      permissionKey('purchase_orders', 'approve'),
      permissionKey('vendor_invoices', 'view'),
      permissionKey('vendor_invoices', 'create'),
      permissionKey('stock_transfers', 'view'),
      permissionKey('customs_clearance', 'view'),
    ],
  },
  {
    id: 'role-dispatcher',
    name: 'Warehouse Dispatcher',
    description: 'Coordinates outbound freight consignments and physical loading bay transfers.',
    isSystem: false,
    memberCount: 12,
    permissions: [
      permissionKey('purchase_orders', 'view'),
      permissionKey('stock_transfers', 'view'),
      permissionKey('stock_transfers', 'create'),
      permissionKey('stock_transfers', 'edit'),
      permissionKey('customs_clearance', 'view'),
      permissionKey('customs_clearance', 'create'),
    ],
  },
  {
    id: 'role-finance',
    name: 'Chief Financial Controller',
    description: 'Immutable system role with statutory compliance signoff and ledger authority.',
    isSystem: true,
    memberCount: 2,
    permissions: [
      permissionKey('purchase_orders', 'view'),
      permissionKey('purchase_orders', 'approve'),
      permissionKey('vendor_invoices', 'view'),
      permissionKey('vendor_invoices', 'create'),
      permissionKey('vendor_invoices', 'edit'),
      permissionKey('vendor_invoices', 'approve'),
      permissionKey('vendor_invoices', 'delete'),
      permissionKey('tax_filings', 'view'),
      permissionKey('tax_filings', 'create'),
      permissionKey('tax_filings', 'edit'),
      permissionKey('tax_filings', 'approve'),
    ],
  },
];

export default function RolesAndPermissionsExample() {
  const [roles, setRoles] = useState<Role[]>(INITIAL_ROLES);
  const [selectedRoleId, setSelectedRoleId] = useState<string>(INITIAL_ROLES[0].id);

  const activeRole = roles.find((r) => r.id === selectedRoleId) || roles[0];

  const handlePermissionsChange = (newPerms: string[]) => {
    if (activeRole.isSystem) return;
    setRoles((prev) =>
      prev.map((role) => (role.id === activeRole.id ? { ...role, permissions: newPerms } : role))
    );
  };

  const handleSave = () => {
    toast('Security policy committed', {
      description: `Updated access boundaries for "${activeRole.name}".`,
    });
  };

  return (
    <div className="p-6 space-y-6 bg-background border rounded-lg">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Access control & security roles</h2>
          <p className="text-sm text-muted-foreground">
            Northwind Traders Pvt Ltd enterprise role-based authorization matrix.
          </p>
        </div>
        {!activeRole.isSystem && (
          <Button variant="primary" size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save permissions
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Role Navigation Column */}
        <div className="lg:col-span-4 space-y-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            System & Custom Roles
          </span>
          <div className="space-y-2">
            {roles.map((role) => (
              <Card
                key={role.id}
                tabIndex={0}
                role="button"
                onClick={() => setSelectedRoleId(role.id)}
                className={`p-4 cursor-pointer transition-colors ${
                  role.id === selectedRoleId
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm text-foreground">{role.name}</span>
                  {role.isSystem ? (
                    <Badge variant="secondary" className="text-[10px] gap-1">
                      <Lock className="h-2.5 w-2.5" />
                      System
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px]">
                      Custom
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {role.description}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>{role.memberCount} assigned associates</span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right: Permission Matrix View */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-4 border rounded-lg bg-card space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base text-foreground">{activeRole.name}</h3>
              {activeRole.isSystem && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Lock className="h-3.5 w-3.5" />
                  Read-only system role
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{activeRole.description}</p>
          </div>

          <div className="border rounded-lg overflow-x-auto bg-card">
            <PermissionMatrix
              aria-label={`Permissions for ${activeRole.name}`}
              resources={SYSTEM_RESOURCES}
              actions={SYSTEM_ACTIONS}
              value={activeRole.permissions}
              onValueChange={handlePermissionsChange}
              readOnly={activeRole.isSystem}
              stickyColumn
            />
          </div>
        </div>
      </div>
    </div>
  );
}
