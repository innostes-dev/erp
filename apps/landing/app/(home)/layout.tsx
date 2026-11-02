import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { Button } from '@innostes/ui';
import {
  Activity,
  ArrowRight,
  Boxes,
  Briefcase,
  BookOpen,
  DollarSign,
  FileText,
  FolderGit2,
  Layers,
  Server,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import { baseOptions } from '@/lib/layout.shared';

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <HomeLayout
      {...baseOptions()}
      links={[
        { text: 'Home', url: '/', active: 'url' },
        {
          type: 'menu',
          text: 'Business Suites',
          items: [
            {
              text: 'SalesFlow (CRM & Revenue)',
              description: 'Pipelines, quote-to-cash, and revenue forecasting.',
              url: '/modules/salesflow',
              icon: <TrendingUp className="size-4 text-blue-500" />,
            },
            {
              text: 'PeopleOps (Workforce & HR)',
              description: 'Employee directory, org charts, and leave approvals.',
              url: '/modules/peopleops',
              icon: <Users className="size-4 text-emerald-500" />,
            },
            {
              text: 'HireFlow (Recruitment & ATS)',
              description: 'Candidate pipelines, resume indexing, and scorecards.',
              url: '/modules/hireflow',
              icon: <Briefcase className="size-4 text-purple-500" />,
            },
            {
              text: 'LedgerFlow (Finance & Billing)',
              description: 'Double-entry general ledger and invoicing.',
              url: '/modules/ledgerflow',
              icon: <DollarSign className="size-4 text-amber-500" />,
            },
            {
              text: 'StockFlow (Inventory & Logistics)',
              description: 'Multi-warehouse stock, batches, and purchase orders.',
              url: '/modules/stockflow',
              icon: <Boxes className="size-4 text-cyan-500" />,
            },
            {
              text: 'SprintFlow (Agile & Issues)',
              description: 'Sprint planning, Kanban boards, and issue tracking.',
              url: '/modules/sprintflow',
              icon: <FolderGit2 className="size-4 text-indigo-500" />,
            },
            {
              text: 'DocFlow (Living SOPs & Docs)',
              description: 'Company wiki, markdown SOPs, and version control.',
              url: '/modules/docflow',
              icon: <FileText className="size-4 text-rose-500" />,
            },
            {
              text: 'View All Suites Directory',
              description: 'Explore the full modular business ecosystem.',
              url: '/modules',
              icon: <Layers className="size-4 text-fd-foreground" />,
            },
          ],
        },
        {
          type: 'menu',
          text: 'Developer Tools',
          items: [
            {
              text: '@innostes/ui Component Framework',
              description: 'Standalone 240+ WCAG-accessible components for any React project.',
              url: '/ui',
              icon: <Layers className="size-4 text-purple-500" />,
            },
            {
              text: 'Tracura Universal API Telemetry',
              description: 'Sub-millisecond ring buffer for 10k+ req/s request inspection.',
              url: '/plugins/tracura',
              icon: <Activity className="size-4 text-emerald-500" />,
            },
            {
              text: 'REST OpenAPI 3.1 Reference',
              description: 'Decoupled headless API schemas and endpoint specifications.',
              url: '/api-reference',
              icon: <Server className="size-4 text-blue-500" />,
            },
          ],
        },
        { text: 'Services & Pricing', url: '/services', active: 'url' },
        {
          type: 'menu',
          text: 'Docs',
          items: [
            {
              text: 'Developer Docs',
              description: 'Set up, run and build the Innostes platform.',
              url: '/docs',
              icon: <BookOpen className="size-4" />,
            },
            {
              text: 'Tracura Observability Docs',
              description: 'Universal telemetry ingestion, scoped keys & API reference.',
              url: '/plugins/tracura/docs',
              icon: <Activity className="size-4" />,
            },
            {
              text: 'Innostes UI Docs',
              description: 'Components, theming and usage of the design system.',
              url: '/ui/docs',
              icon: <Layers className="size-4" />,
            },
            {
              text: 'API Reference',
              description: 'REST API endpoints, OpenAPI schemas and authentication.',
              url: '/api-reference',
              icon: <Server className="size-4" />,
            },
          ],
        },
        {
          type: 'custom',
          on: 'nav',
          secondary: true,
          children: (
            <li>
              <Button
                size="sm"
                render={<a href="/docs/getting-started" />}
                nativeButton={false}
              >
                Deploy Free (0 Rs)
              </Button>
            </li>
          ),
        },
      ]}
    >
      {children}
    </HomeLayout>
  );
}
