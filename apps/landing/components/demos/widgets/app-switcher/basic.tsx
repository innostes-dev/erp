'use client';

import { AppSwitcher } from '@innostes/ui';
import { Building, Users, Briefcase, FileText } from 'lucide-react';
import { useState } from 'react';

export default function AppSwitcherDemo() {
  const [activeApp, setActiveApp] = useState('hrms');

  const sections = [
    {
      label: 'Core Modules',
      apps: [
        {
          id: 'erp',
          name: 'ERP',
          description: 'Business operations',
          icon: <Building />,
          tone: 'chart-1' as const
        },
        {
          id: 'hrms',
          name: 'HRMS',
          description: 'People & HR',
          icon: <Users />,
          tone: 'chart-3' as const
        },
      ]
    },
    {
      label: 'Add-ons',
      apps: [
        {
          id: 'crm',
          name: 'CRM',
          description: 'Customer relationships',
          icon: <Briefcase />,
          tone: 'chart-2' as const
        },
        {
          id: 'invoicing',
          name: 'Invoicing',
          description: 'Billing and payments',
          icon: <FileText />,
          tone: 'chart-4' as const,
          disabled: true
        },
      ]
    }
  ];

  return (
    <div className="flex items-center justify-center p-12">
      <AppSwitcher
        value={activeApp}
        onValueChange={setActiveApp}
        sections={sections}
      />
    </div>
  );
}
