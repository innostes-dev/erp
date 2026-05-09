export default function PayrollPage() {
  return (
    <div className="module-page">
      <header className="page-header">
        <h1>Payroll Management</h1>
        <p>Review and process monthly compensation batches.</p>
      </header>

      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-label">Next Pay Date</span>
          <span className="stat-value">May 31, 2026</span>
          <span className="stat-change">22 days remaining</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Payroll Cost</span>
          <span className="stat-value">$428,500</span>
          <span className="stat-change positive">+2.4% vs last month</span>
        </div>
      </div>

      <div className="page-content-card">
        <h3>Recent Batches</h3>
        <div className="sample-table">
          <div className="table-header">
            <span>Batch ID</span>
            <span>Period</span>
            <span>Amount</span>
            <span>Status</span>
          </div>
          <div className="table-row">
            <span>#PY-2026-04</span>
            <span>April 2026</span>
            <span>$418,200</span>
            <span className="status-badge active">Paid</span>
          </div>
          <div className="table-row">
            <span>#PY-2026-03</span>
            <span>March 2026</span>
            <span>$415,800</span>
            <span className="status-badge active">Paid</span>
          </div>
        </div>
      </div>
    </div>
  );
}
