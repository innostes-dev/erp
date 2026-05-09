export default function SuiteLoading() {
  return (
    <section className="shell">
      <header className="topbar">
        <div className="skeleton" style={{ height: 18, width: 180 }} />
        <div className="skeleton" style={{ height: 18, width: 60 }} />
      </header>
      <div className="content">
        <div className="skeleton" style={{ height: 24, width: 260, marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 180 }} />
      </div>
    </section>
  );
}
