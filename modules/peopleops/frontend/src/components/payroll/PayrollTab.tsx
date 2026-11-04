import { 
  Button, 
  EmptyState, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
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
} from '@innostes/ui';
import { CreditCard, FileSpreadsheet, Plus, FileText, Download } from 'lucide-react';
import { useState } from 'react';

export function PayrollTab() {
  const [runs] = useState([
    { id: '1', period: 'Nov 2026', status: 'DRAFT', gross: '1,500,000', net: '1,200,000', employees: 42 }
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between pb-2">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Payroll Engine</h3>
          <p className="text-sm text-muted-foreground">Process monthly salary batches, generate statutory payslips, and export bank CMS files.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" startIcon={<FileSpreadsheet />}>
            Bank CMS Export
          </Button>
          <Button size="sm" startIcon={<Plus />}>
            New Pay Run
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total YTD Gross Pay</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹16,500,000</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total YTD Net Pay</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹13,200,000</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total YTD Taxes</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹3,300,000</div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border">
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
                    icon={<CreditCard />}
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
                  <TableCell className="text-right">₹{run.gross}</TableCell>
                  <TableCell className="text-right">₹{run.net}</TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger>
                        <Button variant="ghost" size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>Payslip Preview - {run.period}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                           <div className="rounded border p-8 flex flex-col items-center justify-center min-h-[400px] bg-slate-50">
                              <p className="text-muted-foreground text-sm">Payslip Vector PDF Preview</p>
                              <Button className="mt-4" variant="outline" startIcon={<Download />}>Download Sample</Button>
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
