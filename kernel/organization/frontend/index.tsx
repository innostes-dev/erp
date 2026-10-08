import React, { useState } from 'react';

export interface OrganizationUIProps {
  onOrganizationSelect?: (orgId: string) => void;
}

export function OrganizationManagementView({ onOrganizationSelect }: OrganizationUIProps) {
  const [orgs, setOrgs] = useState<Array<{ id: string; name: string; slug: string }>>([
    { id: '1', name: 'Acme Enterprise', slug: 'acme-enterprise' },
  ]);

  return (
    <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Organizations</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Manage tenant organizations and workspace slugs</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
          + New Organization
        </button>
      </div>

      <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {orgs.map((org) => (
          <div key={org.id} className="py-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{org.name}</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">slug: {org.slug}</p>
            </div>
            <button
              onClick={() => onOrganizationSelect?.(org.id)}
              className="text-xs text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Select
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OrganizationManagementView;
