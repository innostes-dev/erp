export default function ModuleLoading() {
  return (
    <div className="suite-grid">
      <aside className="sidebar">
        <div className="skeleton" style={{ height: 24, width: 140, marginBottom: 14 }} />
        <div className="skeleton" style={{ height: 16, width: 100, marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 16, width: 160, marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 16, width: 120 }} />
      </aside>
      <main className="content">
        <div className="skeleton" style={{ height: 24, width: 220, marginBottom: 10 }} />
        <div className="skeleton" style={{ height: 220 }} />
      </main>
    </div>
  );
}
