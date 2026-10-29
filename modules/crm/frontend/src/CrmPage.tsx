import { useState } from 'react';
import {
  Badge,
  Button,
  EmptyState,
  PageHeader,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from '@innostes/ui';
import {
  Briefcase,
  Contact2,
  DollarSign,
  Plus,
  Sparkles,
  Target,
} from 'lucide-react';
import { crmManifest, type SubFeature } from './manifest';

export function CrmPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Module Header */}
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <span>{crmManifest.name}</span>
            <Badge variant="outline">Module Scaffold</Badge>
            <Badge variant="success" dot>Active</Badge>
          </div>
        }
        description={crmManifest.description}
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" startIcon={<Plus />}>
              New Deal
            </Button>
          </div>
        }
      />

      {/* Sub-feature Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(String(val))}>
        <TabsList>
          {crmManifest.subFeatures.map((sub: SubFeature) => (
            <TabsTab key={sub.id} value={sub.id}>
              {sub.label}
            </TabsTab>
          ))}
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsPanel value="overview" className="pt-4">
          <EmptyState
            icon={<Target />}
            title="CRM Module Operational"
            description="The CRM application is active. Manage customer relationships, track incoming leads, advance deals, and monitor your sales pipeline."
            actions={
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setActiveTab('leads')}>
                  View Leads
                </Button>
                <Button size="sm" variant="outline" onClick={() => setActiveTab('pipeline')}>
                  Kanban Pipeline
                </Button>
              </div>
            }
          />
        </TabsPanel>

        {/* Tab 2: Leads */}
        <TabsPanel value="leads" className="pt-4">
          <EmptyState
            icon={<Sparkles />}
            title="No Inbound Leads Yet"
            description="Captured leads from marketing forms, website visitors, and campaigns will appear here."
            actions={
              <Button size="sm" startIcon={<Plus />}>
                Create Lead
              </Button>
            }
          />
        </TabsPanel>

        {/* Tab 3: Deals */}
        <TabsPanel value="deals" className="pt-4">
          <EmptyState
            icon={<DollarSign />}
            title="No Opportunities in Deal Stage"
            description="Track high-value proposals, expected close dates, and contract negotiations."
            actions={
              <Button size="sm" startIcon={<Plus />}>
                Add Deal
              </Button>
            }
          />
        </TabsPanel>

        {/* Tab 4: Pipeline */}
        <TabsPanel value="pipeline" className="pt-4">
          <EmptyState
            icon={<Briefcase />}
            title="Visual Sales Pipeline"
            description="Customize stages: Qualification, Needs Analysis, Proposal, Negotiation, and Closed Won."
            actions={
              <Button size="sm" variant="outline">
                Configure Pipeline Stages
              </Button>
            }
          />
        </TabsPanel>

        {/* Tab 5: Contacts */}
        <TabsPanel value="contacts" className="pt-4">
          <EmptyState
            icon={<Contact2 />}
            title="Customer Accounts & Contacts"
            description="Synchronize client contacts, account hierarchies, and communication history."
            actions={
              <Button size="sm" startIcon={<Plus />}>
                Add Contact
              </Button>
            }
          />
        </TabsPanel>
      </Tabs>
    </div>
  );
}

export default CrmPage;
