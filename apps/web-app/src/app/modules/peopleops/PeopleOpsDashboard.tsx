import { useAuth } from '@innostes/kernel';
import { ModulePageHeader } from '../../components/ModulePageHeader';
import { useState, useEffect } from 'react';
import {
  Badge,
  Button,
  Card,
} from '@innostes/ui';
import {
  Clock,
  CheckCircle2,
  FileText,
  Sun,
  Coffee,
  Check,
  Send,
  X,
} from 'lucide-react';
import {
  EmployeesTab,
  AttendanceTab,
  LeaveTab,
  PayrollTab,
  ExpensesTab,
  OffboardingTab,
  MastersTab,
} from '@innostes/peopleops';

interface ApprovalItem {
  id: string;
  name: string;
  avatar: string;
  type: string;
  details: string;
  reason: string;
}

/** PeopleOps router: each sub-page is its own component, so hooks never change order. */
export function PeopleOpsDashboard({ activeSubFeatureId = 'dashboard' }: { activeSubFeatureId?: string }) {
  switch (activeSubFeatureId) {
    case 'employees':
      return <EmployeesTab />;
    case 'attendance':
      return <AttendanceTab />;
    case 'leave':
      return <LeaveTab />;
    case 'payroll':
      return <PayrollTab />;
    case 'expenses':
      return <ExpensesTab />;
    case 'offboarding':
      return <OffboardingTab />;
    case 'masters':
      return <MastersTab />;
    default:
      return <PeopleOpsHome />;
  }
}

/** PeopleOps dashboard: check-in, balances, approvals. */
function PeopleOpsHome() {
  const { user } = useAuth();
  // Web Check-In & Timer state
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [secondsToday, setSecondsToday] = useState(4 * 3600 + 22 * 60 + 15); // e.g. 4h 22m
  const [workMode, setWorkMode] = useState<'office' | 'wfh' | 'field'>('office');
  const [firstInTime, setFirstInTime] = useState<string | null>(null);

  // Leave Modal State
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveType, setLeaveType] = useState('casual');
  const [leaveDays, setLeaveDays] = useState('1');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveSuccess, setLeaveSuccess] = useState(false);

  // Balances
  const [balances, setBalances] = useState({
    casual: 4.0,
    sick: 6.0,
    paid: 12.5,
  });

  // Approvals Queue
  const [approvals, setApprovals] = useState<ApprovalItem[]>([
    {
      id: 'app-1',
      name: 'Sneha Roy',
      avatar: 'SR',
      type: '1 Day Casual Leave',
      details: 'Nov 05, 2026 (Full Day)',
      reason: 'Attending family celebration in hometown',
    },
    {
      id: 'app-2',
      name: 'Rahul Verma',
      avatar: 'RV',
      type: 'Punch Regularization',
      details: 'Nov 01, 2026 (OUT: 06:45 PM)',
      reason: 'Forgot to punch out before leaving premises',
    },
  ]);

  // Live timer tick when checked in
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isCheckedIn) {
      interval = setInterval(() => {
        setSecondsToday((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCheckedIn]);

  function handleCheckToggle() {
    if (!isCheckedIn) {
      setIsCheckedIn(true);
      if (!firstInTime) {
        const now = new Date();
        setFirstInTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } else {
      setIsCheckedIn(false);
    }
  }

  function handleApprove(id: string) {
    setApprovals((prev) => prev.filter((a) => a.id !== id));
  }

  function handleReject(id: string) {
    setApprovals((prev) => prev.filter((a) => a.id !== id));
  }

  function handleApplyLeaveSubmit(e: React.FormEvent) {
    e.preventDefault();
    const days = parseFloat(leaveDays) || 1;
    if (leaveType === 'casual') {
      setBalances((prev) => ({ ...prev, casual: Math.max(0, prev.casual - days) }));
    } else if (leaveType === 'sick') {
      setBalances((prev) => ({ ...prev, sick: Math.max(0, prev.sick - days) }));
    } else if (leaveType === 'paid') {
      setBalances((prev) => ({ ...prev, paid: Math.max(0, prev.paid - days) }));
    }
    setLeaveSuccess(true);
    setTimeout(() => {
      setLeaveSuccess(false);
      setShowLeaveModal(false);
      setLeaveReason('');
    }, 1200);
  }

  function formatTime(totalSec: number) {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}h : ${mins.toString().padStart(2, '0')}m : ${secs.toString().padStart(2, '0')}s`;
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="flex flex-col gap-6">
      <ModulePageHeader
        preview
        title={`${greeting}${user?.first_name ? `, ${user.first_name}` : ''}`}
        description={`PeopleOps · ${new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`}
      />

      {/* 2. Top Interactive Operational Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* A. Quick Web Check-In Widget (Zoho People Benchmark) */}
        <Card className="p-6 flex flex-col justify-between border-border bg-card shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Web Attendance Check-In</h2>
            </div>
            <Badge variant={isCheckedIn ? 'success' : 'outline'} dot>
              {isCheckedIn ? 'Clocked In' : 'Clocked Out'}
            </Badge>
          </div>

          <div className="my-5 flex flex-col items-center justify-center text-center">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
              Logged Working Hours Today
            </span>
            <div className="text-3xl font-mono font-extrabold text-foreground tracking-tight py-1">
              {formatTime(secondsToday)}
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
              <span>First In: <strong className="text-foreground">{firstInTime || '09:14 AM'}</strong></span>
              <span>•</span>
              <span>Last Out: <strong className="text-foreground">{isCheckedIn ? '--:--' : '01:30 PM'}</strong></span>
            </div>
          </div>

          {/* Location Mode Selector */}
          <div className="flex items-center justify-between gap-1 p-1 bg-muted rounded-xl mb-4 border border-border">
            <button
              type="button"
              onClick={() => setWorkMode('office')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                workMode === 'office'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Office
            </button>
            <button
              type="button"
              onClick={() => setWorkMode('wfh')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                workMode === 'wfh'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Remote (WFH)
            </button>
            <button
              type="button"
              onClick={() => setWorkMode('field')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                workMode === 'field'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              ✈On Duty
            </button>
          </div>

          {/* Big Action Check In/Out Button */}
          <Button
            size="lg"
            variant={isCheckedIn ? 'destructive' : 'primary'}
            className="w-full text-sm font-bold shadow-md cursor-pointer"
            onClick={handleCheckToggle}
          >
            {isCheckedIn ? 'Web Check-Out' : 'Web Check-In'}
          </Button>
        </Card>

        {/* B. Leave Balances Snapshot & Quick Apply */}
        <Card className="p-6 flex flex-col justify-between border-border bg-card shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Sun className="size-4 text-warning-text" />
              <h2 className="text-sm font-semibold text-foreground">My Leave Balances</h2>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="font-semibold text-primary"
              onClick={() => setShowLeaveModal(true)}
            >
              + Apply Leave
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2.5 my-4">
            <div className="p-3 rounded-xl bg-muted border border-border flex flex-col items-center justify-center text-center">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Casual</span>
              <span className="text-2xl font-bold text-foreground mt-1">{balances.casual.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">Days left</span>
            </div>
            <div className="p-3 rounded-xl bg-muted border border-border flex flex-col items-center justify-center text-center">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Sick</span>
              <span className="text-2xl font-bold text-foreground mt-1">{balances.sick.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">Days left</span>
            </div>
            <div className="p-3 rounded-xl bg-muted border border-border flex flex-col items-center justify-center text-center">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Paid / Earned</span>
              <span className="text-2xl font-bold text-foreground mt-1">{balances.paid.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">Days left</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-primary-tint border border-border text-xs flex items-center justify-between">
            <span className="text-strong-foreground">Upcoming Public Holiday:</span>
            <span className="font-semibold text-foreground">Diwali — Nov 12 (Thu)</span>
          </div>
        </Card>

        {/* C. Team Presence (Who's Out Today) */}
        <Card className="p-6 flex flex-col justify-between border-border bg-card shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Coffee className="size-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Who's Out Today (Team)</h2>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">Engineering</span>
          </div>

          <div className="flex flex-col gap-3 my-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="size-7 rounded-full bg-warning-bg text-warning-text font-bold flex items-center justify-center text-xs">
                  PS
                </div>
                <div>
                  <p className="font-semibold text-foreground">Priya Sharma</p>
                  <p className="text-xs text-muted-foreground">QA Engineer</p>
                </div>
              </div>
              <Badge variant="warning">On Leave</Badge>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="size-7 rounded-full bg-primary-tint text-primary font-bold flex items-center justify-center text-xs">
                  VN
                </div>
                <div>
                  <p className="font-semibold text-foreground">Vikram Nair</p>
                  <p className="text-xs text-muted-foreground">Backend Lead</p>
                </div>
              </div>
              <Badge variant="outline">Remote (WFH)</Badge>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="size-7 rounded-full bg-success-bg text-success-text font-bold flex items-center justify-center text-xs">
                  AD
                </div>
                <div>
                  <p className="font-semibold text-foreground">Anita Desai</p>
                  <p className="text-xs text-muted-foreground">DevOps Specialist</p>
                </div>
              </div>
              <Badge variant="success">On Duty (Client)</Badge>
            </div>
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Team Attendance Rate:</span>
            <strong className="text-foreground">88% Present</strong>
          </div>
        </Card>
      </div>

      {/* 3. Bottom Row: Manager Approvals Queue & Quick Self-Service Access */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Manager Approvals Queue (2 Columns) */}
        <Card className="lg:col-span-2 p-6 border-border bg-card shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Pending Team Approvals</h2>
            </div>
            <Badge variant="outline">{approvals.length} Requests Pending</Badge>
          </div>

          {approvals.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm flex flex-col items-center justify-center gap-2">
              <Check className="size-8 text-success-text bg-success-bg p-1.5 rounded-full" />
              <span>All clear! No pending team requests.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {approvals.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-border bg-canvas flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="size-9 rounded-full bg-primary-tint text-primary font-bold flex items-center justify-center text-xs shrink-0">
                      {item.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{item.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {item.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.details}</p>
                      <p className="text-xs italic text-muted-foreground mt-1">
                        &ldquo;{item.reason}&rdquo;
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <Button
                      size="sm"
                      variant="primary"
                      className="bg-success hover:bg-success text-xs"
                      onClick={() => handleApprove(item.id)}
                    >
                      ✓ Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:bg-error-bg text-xs"
                      onClick={() => handleReject(item.id)}
                    >
                      ✗ Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Quick Self-Service Documents & Shortcuts */}
        <Card className="p-6 border-border bg-card shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Self-Service Shortcuts</h2>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="p-3 rounded-xl bg-canvas border border-border flex items-center justify-between hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-success-bg text-success-text flex items-center justify-center">
                    <FileText className="size-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">October 2026 Payslip</p>
                    <p className="text-xs text-muted-foreground">₹85,400 • Net Disbursed</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Download PDF
                </Button>
              </div>

              <div className="p-3 rounded-xl bg-canvas border border-border flex items-center justify-between hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-primary-tint text-primary flex items-center justify-center">
                    <Clock className="size-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Punch Regularization</p>
                    <p className="text-xs text-muted-foreground">Request missing punch fix</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Request
                </Button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border text-xs text-muted-foreground text-center">
            Need HR assistance? Email <strong className="text-foreground">people@innostes.com</strong>
          </div>
        </Card>
      </div>

      {/* 4. Apply Leave Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 bg-card flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 bg-card border-border shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="text-base font-bold text-foreground">Apply for Time Off</h2>
              <button
                type="button"
                onClick={() => setShowLeaveModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {leaveSuccess ? (
              <div className="py-8 flex flex-col items-center justify-center text-center gap-2">
                <Check className="size-10 text-success-text bg-success-bg p-2 rounded-full" />
                <p className="text-base font-bold text-foreground">Leave Submitted!</p>
                <p className="text-xs text-muted-foreground">Your manager has been notified for sign-off.</p>
              </div>
            ) : (
              <form onSubmit={handleApplyLeaveSubmit} className="flex flex-col gap-4 mt-4">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Leave Type</label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-border bg-background text-foreground"
                  >
                    <option value="casual">Casual Leave ({balances.casual.toFixed(1)} available)</option>
                    <option value="sick">Sick Leave ({balances.sick.toFixed(1)} available)</option>
                    <option value="paid">Paid / Earned Leave ({balances.paid.toFixed(1)} available)</option>
                    <option value="unpaid">Loss of Pay (Unpaid)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">Start Date</label>
                    <input
                      type="date"
                      defaultValue="2026-11-05"
                      className="w-full text-xs p-2 rounded-lg border border-border bg-background text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">Duration (Days)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="15"
                      value={leaveDays}
                      onChange={(e) => setLeaveDays(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-border bg-background text-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Reason / Note</label>
                  <textarea
                    rows={2}
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    placeholder="Briefly state reason for leave..."
                    className="w-full text-xs p-2 rounded-lg border border-border bg-background text-foreground resize-none"
                    required
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowLeaveModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" startIcon={<Send className="size-3" />}>
                    Submit Request
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
