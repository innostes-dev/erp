import { 
  Button, 
  EmptyState, 
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  PageHeader,
  MetricCard,
  IconTile,
} from '@innostes/ui';
import { CreditCard, FileSpreadsheet, Plus, FileText, Download } from 'lucide-react';
import { useState } from 'react';

export function PayrollTab() {
  const [runs] = useState([
    { id: '1', period: 'Nov 2026', status: 'DRAFT', gross: '1,500,000', net: '1,200,000', employees: 42 }
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Payroll Engine"
        description="Process monthly salary batches, generate statutory payslips, and export bank CMS files."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" startIcon={<FileSpreadsheet />}>
              Bank CMS Export
            </Button>
            <Button size="sm" startIcon={<Plus />}>
              New Pay Run
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Year-to-date gross pay" value="₹1,65,00,000" icon={<CreditCard />} tone="neutral" />
        <MetricCard label="Year-to-date net pay" value="₹1,32,00,000" icon={<CreditCard />} tone="neutral" />
        <MetricCard label="Year-to-date taxes withheld" value="₹33,00,000" icon={<CreditCard />} tone="neutral" />
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pay Period</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Employees</TableHead>
              <TableHead className="text-right">Gross Pay</TableHead>
              <TableHead className="text-right">Net Pay</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <EmptyState
                    icon={<IconTile tone="neutral" size="lg"><CreditCard /></IconTile>}
                    title="No Payroll Runs Executed"
                    description="Run monthly gross-to-net payroll calculations with statutory deductions."
                  />
                </TableCell>
              </TableRow>
            ) : (
              runs.map((run) => (
                <TableRow key={run.id}>
                  <TableCell className="font-medium">{run.period}</TableCell>
                  <TableCell>
                    <Badge variant={run.status === 'DRAFT' ? 'secondary' : 'default'}>
                      {run.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{run.employees}</TableCell>
                  <TableCell className="text-right tabular">₹{run.gross}</TableCell>
                  <TableCell className="text-right tabular">₹{run.net}</TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger
                        render={<Button variant="ghost" size="sm" iconOnly aria-label={`Preview payslip for ${run.period}`} />}
                      >
                        <FileText />
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>Payslip Preview - {run.period}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                           <div className="rounded border p-8 flex flex-col items-center justify-center min-h-[400px] bg-canvas">
                              <p className="text-muted-foreground text-sm">Payslip Vector PDF Preview</p>
                              <Button className="mt-4" variant="secondary" startIcon={<Download />}>Download Sample</Button>
                           </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
