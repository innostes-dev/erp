export default function EmployeesPage() {
  return (
    <div className="module-page">
      <header className="page-header">
        <h1>Employee Directory</h1>
        <p>Manage and view all enterprise personnel.</p>
      </header>

      <div className="page-content-card">
        <div className="table-actions">
          <input type="text" placeholder="Search employees..." className="search-input" />
          <button className="primary-btn">+ New Employee</button>
        </div>

        <div className="sample-table">
          <div className="table-header">
            <span>Name</span>
            <span>Department</span>
            <span>Role</span>
            <span>Status</span>
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div className="table-row" key={i}>
              <div className="user-info">
                <div className="user-avatar-sm" />
                <span>Employee {i}</span>
              </div>
              <span>Engineering</span>
              <span>Software Engineer</span>
              <span className="status-badge active">Active</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
