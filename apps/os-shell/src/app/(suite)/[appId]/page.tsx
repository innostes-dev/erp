import { BRANDING } from '@innostes/core/design-system';

export default async function ModuleHome({ params }: { params: { appId: string } }) {
  const isHrms = params.appId === 'hr';

  return (
    <section className="module-dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Welcome to {isHrms ? 'HRMS' : params.appId.toUpperCase()}</h1>
          <p>Real-time enterprise overview for the {isHrms ? 'Human Resources' : params.appId} module.</p>
        </div>
        <div className="dashboard-actions">
          <button className="primary-btn">+ Add Employee</button>
        </div>
      </header>

      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-label">Total Employees</span>
          <span className="stat-value">1,248</span>
          <span className="stat-change positive">+12% from last month</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Active Payroll</span>
          <span className="stat-value">$428.5k</span>
          <span className="stat-change">Processed yesterday</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Pending Leaves</span>
          <span className="stat-value">18</span>
          <span className="stat-change negative">4 high priority</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Open Positions</span>
          <span className="stat-value">24</span>
          <span className="stat-change positive">6 new this week</span>
        </div>
      </div>

      <div className="dashboard-grid">
        <article className="dashboard-card large">
          <div className="card-header">
            <h3>Workforce Distribution</h3>
            <p>Staffing levels across departments.</p>
          </div>
          <div className="chart-container">
            <div className="chart-bar-group">
              <div className="chart-bar" style={{ height: '70%' }} data-label="Eng"></div>
              <div className="chart-bar" style={{ height: '45%' }} data-label="Sales"></div>
              <div className="chart-bar" style={{ height: '90%' }} data-label="HR"></div>
              <div className="chart-bar" style={{ height: '60%' }} data-label="Ops"></div>
              <div className="chart-bar" style={{ height: '85%' }} data-label="Mkt"></div>
            </div>
          </div>
        </article>

        <article className="dashboard-card">
          <div className="card-header">
            <h3>Recent Activity</h3>
            <p>Latest updates in the module.</p>
          </div>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-avatar">JD</div>
              <div className="activity-info">
                <strong>John Doe</strong>
                <span>New hire started in Engineering</span>
              </div>
              <span className="activity-time">2h ago</span>
            </div>
            <div className="activity-item">
              <div className="activity-avatar payroll">P</div>
              <div className="activity-info">
                <strong>Payroll Processed</strong>
                <span>Monthly batch for Sales team</span>
              </div>
              <span className="activity-time">5h ago</span>
            </div>
            <div className="activity-item">
              <div className="activity-avatar leave">L</div>
              <div className="activity-info">
                <strong>Sarah Smith</strong>
                <span>Leave request approved</span>
              </div>
              <span className="activity-time">1d ago</span>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
