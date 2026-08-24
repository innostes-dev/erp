/**
 * MetricCard â€” Usage Examples
 *
 * Demonstrates all 7 layout themes with semantic color variants, dark mode,
 * appearance overrides, and loading states.
 */

import React from "react";
import { MetricCard } from "../MetricCard";

// â”€â”€â”€ Example icons (inline SVG â€” substitute with your icon library) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const RevenueIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const UsersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ChartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const ServerIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
    <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
    <line x1="6" y1="6" x2="6.01" y2="6" />
    <line x1="6" y1="18" x2="6.01" y2="18" />
  </svg>
);

// â”€â”€â”€ 1. Minimal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function MinimalExample() {
  return (
    <div style={{ width: 300 }}>
      <MetricCard
        theme="minimal"
        title="Total Revenue"
        value="$48,295"
        change={12.5}
        trend="up"
        description="Compared to $42,923 last month"
      />
    </div>
  );
}

// â”€â”€â”€ 2. Modern â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function ModernExample() {
  return (
    <div style={{ width: 300 }}>
      <MetricCard
        theme="modern"
        title="Total Revenue"
        value="$48,295"
        change={12.5}
        trend="up"
        icon={<RevenueIcon />}
        description="vs last month"
      />
    </div>
  );
}

// â”€â”€â”€ 3. Glass â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function GlassExample() {
  return (
    // Glass looks best over a coloured / image background
    <div style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%)", padding: "2rem", borderRadius: "16px", width: 320 }}>
      <MetricCard
        theme="glass"
        title="Active Users"
        value="24,819"
        change={8.3}
        trend="up"
        icon={<UsersIcon />}
        description="Peak hours: 09:00â€“11:00"
      />
    </div>
  );
}

// â”€â”€â”€ 4. Gradient â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function GradientExample() {
  return (
    <div style={{ width: 300 }}>
      <MetricCard
        theme="gradient"
        variant="info"
        title="Monthly Recurring Revenue"
        value="$128,400"
        change={-3.1}
        trend="down"
        icon={<ChartIcon />}
        description="Target: $135,000"
      />
    </div>
  );
}

// ─── 5. Filled ───────────────────────────────────────────────────────────────

export function FilledExample() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(180px, 1fr))", gap: "1rem" }}>
      <MetricCard theme="filled" variant="primary" title="Total Revenue"   value="$48,295" change={12.5}  trend="up" icon={<RevenueIcon />} description="vs last month" />
      <MetricCard theme="filled" variant="success" title="Conversion Rate" value="4.28%"   change={21.7}  trend="up" icon={<ChartIcon />}   description="vs last month" />
      <MetricCard theme="filled" variant="warning" title="API Latency"     value="142 ms"  change={-18.2} trend="up" icon={<ServerIcon />}  description="P95 · us-east-1" />
    </div>
  );
}

// â”€â”€â”€ 5. Enterprise â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function EnterpriseExample() {
  return (
    <div style={{ width: 360 }}>
      <MetricCard
        theme="enterprise"
        variant="warning"
        title="API Response Time"
        value="142 ms"
        change={-18.2}
        trend="up"
        icon={<ServerIcon />}
        description="P95 latency Â· us-east-1"
      />
    </div>
  );
}

// â”€â”€â”€ 6. Compact â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function CompactExample() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: 320 }}>
      <MetricCard theme="compact" title="Sessions"      value="9,241"  change={5.4}  trend="up"      icon={<ChartIcon />} />
      <MetricCard theme="compact" title="Bounce Rate"   value="38.7%"  change={-2.1} trend="up"      icon={<ChartIcon />} />
      <MetricCard theme="compact" title="Avg. Duration" value="2m 44s" change={0}    trend="neutral" icon={<UsersIcon />} />
    </div>
  );
}

// â”€â”€â”€ 7. Trend â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function TrendExample() {
  return (
    <div style={{ width: 300 }}>
      <MetricCard
        theme="trend"
        title="Conversion Rate"
        value="4.28%"
        change={21.7}
        trend="up"
        icon={<ChartIcon />}
        description="Goal: 5.0% Â· Updated 2 min ago"
      />
    </div>
  );
}

// â”€â”€â”€ 8. Dark mode â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function DarkModeExample() {
  return (
    <div style={{ background: "#111827", padding: "2rem", borderRadius: "16px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(200px, 1fr))", gap: "1rem" }}>
        <MetricCard mode="dark" theme="modern"     title="Revenue"    value="$48,295" change={12.5}  trend="up" icon={<RevenueIcon />} />
        <MetricCard mode="dark" theme="enterprise" title="Users"      value="24,819"  change={8.3}   trend="up" icon={<UsersIcon />}   accentColor="#a78bfa" />
        <MetricCard mode="dark" theme="compact"    title="API P95"    value="142 ms"  change={-18}   trend="up" icon={<ServerIcon />} />
        <MetricCard mode="dark" theme="trend"      title="Conversion" value="4.28%"   change={21.7}  trend="up" icon={<ChartIcon />} />
      </div>
    </div>
  );
}

// â”€â”€â”€ 9. Loading state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function LoadingExample() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(200px, 1fr))", gap: "1rem" }}>
      <MetricCard theme="modern"   title="" value="" loading />
      <MetricCard theme="gradient" title="" value="" loading accentColor="#0ea5e9" />
      <MetricCard theme="compact"  title="" value="" loading />
    </div>
  );
}

// â”€â”€â”€ 10. Appearance overrides â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function AppearanceExample() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(240px, 1fr))", gap: "1rem" }}>
      {/* Default typography scale */}
      <MetricCard
        theme="modern"
        title="Total Revenue"
        value="$48,295"
        change={12.5}
        trend="up"
        description="vs last month"
        icon={<RevenueIcon />}
      />
      {/* Custom typography scale */}
      <MetricCard
        theme="modern"
        title="Total Revenue"
        value="$48,295"
        change={12.5}
        trend="up"
        description="vs last month"
        icon={<RevenueIcon />}
        appearance={{ titleVariant: "h6", valueVariant: "h2", descriptionVariant: "body2" }}
      />
    </div>
  );
}

// --- 11. Inline -----------------------------------------------------------

export function InlineExample() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(200px, 1fr))", gap: "1rem" }}>
      <MetricCard theme="inline" title="Total Customers"  value="567,899" change={2.5}   trend="up"   icon={<UsersIcon />} />
      <MetricCard theme="inline" title="Monthly Revenue"  value="$48,295" change={12.5}  trend="up"   icon={<RevenueIcon />} />
      <MetricCard theme="inline" title="Churn Rate"       value="2.4%"    change={-0.5}  trend="down" icon={<ChartIcon />} variant="error" />
    </div>
  );
}

// --- 12. Centered --------------------------------------------------------

const PackageIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

export function CenteredExample() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(180px, 1fr))", gap: "1rem" }}>
      <MetricCard theme="centered" title="Total Products"  value="1,525"  icon={<PackageIcon />} variant="primary" />
      <MetricCard theme="centered" title="Active Users"    value="24,819" icon={<UsersIcon />}   variant="secondary" />
      <MetricCard theme="centered" title="Conversion"      value="4.28%"  icon={<ChartIcon />}   variant="success" />
    </div>
  );
}

// --- 13. Surface ----------------------------------------------------------

export function SurfaceExample() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(200px, 1fr))", gap: "1rem" }}>
      <MetricCard theme="surface" title="Total Orders"    value="687.3k"  change={-9.29} trend="down" icon={<ChartIcon />}   variant="info"      description="Since last month" />
      <MetricCard theme="surface" title="Monthly Revenue" value="$48,295" change={12.5}  trend="up"   icon={<RevenueIcon />} variant="success"   description="vs last month" />
      <MetricCard theme="surface" title="Active Users"    value="24,819"  change={8.3}   trend="up"   icon={<UsersIcon />}   variant="secondary" description="vs last month" />
    </div>
  );
}

