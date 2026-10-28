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
  Activity,
  BarChart2,
  Play,
  RotateCcw,
  Send,
  Webhook,
} from 'lucide-react';
import { apiLoggerManifest } from './manifest';

export function ApiLoggerPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Plugin Header */}
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <span>{apiLoggerManifest.name}</span>
            <Badge variant="outline">Plugin Scaffold</Badge>
            <Badge variant="success" dot>Active</Badge>
          </div>
        }
        description={apiLoggerManifest.description}
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" startIcon={<Play />}>
              Send Test Ping
            </Button>
          </div>
        }
      />

      {/* Sub-feature Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(String(val))}>
        <TabsList>
          {apiLoggerManifest.subFeatures.map((sub) => (
            <TabsTab key={sub.id} value={sub.id}>
              {sub.label}
            </TabsTab>
          ))}
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsPanel value="overview" className="pt-4">
          <EmptyState
            icon={<Activity />}
            title="API Logger Plugin Active"
            description="The API Logger extension is active. Inspect incoming API calls, observe header metadata, debug webhook delivery failures, and analyze response latency."
            actions={
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setActiveTab('logs')}>
                  Inspect Request Stream
                </Button>
                <Button size="sm" variant="outline" onClick={() => setActiveTab('webhooks')}>
                  Webhook Deliveries
                </Button>
              </div>
            }
          />
        </TabsPanel>

        {/* Tab 2: Logs */}
        <TabsPanel value="logs" className="pt-4">
          <EmptyState
            icon={<Send />}
            title="Listening for API Traffic"
            description="HTTP requests dispatched to the engine will be intercepted and logged with full request/response bodies."
            actions={
              <Button size="sm" variant="outline" startIcon={<RotateCcw />}>
                Clear Log Buffer
              </Button>
            }
          />
        </TabsPanel>

        {/* Tab 3: Webhooks */}
        <TabsPanel value="webhooks" className="pt-4">
          <EmptyState
            icon={<Webhook />}
            title="No Webhook Events Dispatched"
            description="Monitor event hooks dispatched to external endpoints, including HMAC signature verification and exponential backoff retries."
            actions={
              <Button size="sm" variant="outline">
                Register Webhook Endpoint
              </Button>
            }
          />
        </TabsPanel>

        {/* Tab 4: Analytics */}
        <TabsPanel value="analytics" className="pt-4">
          <EmptyState
            icon={<BarChart2 />}
            title="Latency & Status Codes"
            description="Real-time latency distributions (p50, p95, p99) and HTTP 2xx/4xx/5xx status code charts will populate as traffic flows."
            actions={
              <Button size="sm" variant="outline">
                Export Metrics
              </Button>
            }
          />
        </TabsPanel>
      </Tabs>
    </div>
  );
}

export default ApiLoggerPage;
