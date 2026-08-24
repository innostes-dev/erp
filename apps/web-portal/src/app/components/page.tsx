'use client';

/**
 * /components — Design System Component Showcase
 *
 * Demonstrates all Button variants, sizes, states, and shapes from @luxis-ui/react.
 *
 * Importing directly from @luxis-ui/react — this is both the local workspace package
 * name AND the final published npm package name, so no import changes needed
 * when the package moves to its own repo.
 */

import React, { useState } from 'react';
import { Button } from '@luxis-ui/react';
import {
  HiArrowRight,
  HiDownload,
  HiPlus,
  HiTrash,
  HiCheck,
  HiPencil,
  HiShare,
  HiCog,
} from 'react-icons/hi';

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: '3rem' }}>
      <h2
        style={{
          fontSize: '1.125rem',
          fontWeight: 600,
          color: '#111827',
          marginBottom: '0.25rem',
          paddingBottom: '0.5rem',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        {title}
      </h2>
      {description && (
        <p
          style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            margin: '0.5rem 0 1.25rem',
          }}
        >
          {description}
        </p>
      )}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'center',
        }}
      >
        {children}
      </div>
    </section>
  );
}

// ─── Main showcase page ───────────────────────────────────────────────────────
export default function ComponentsPage() {
  const [loading, setLoading] = useState(false);

  const handleLoadingDemo = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2500);
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f9fafb',
        padding: '2rem',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>

        {/* ── Header ── */}
        <header style={{ marginBottom: '3rem' }}>
          <p
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#6b7280',
              marginBottom: '0.5rem',
            }}
          >
            @luxis-ui/react
          </p>
          <h1
            style={{
              fontSize: '2.25rem',
              fontWeight: 700,
              color: '#111827',
              margin: 0,
            }}
          >
            Button Component
          </h1>
          <p
            style={{
              marginTop: '0.75rem',
              fontSize: '1rem',
              color: '#6b7280',
              maxWidth: '560px',
            }}
          >
            A comprehensive button component with multiple variants, sizes,
            loading states, icon support, and shape options.
          </p>
        </header>

        {/* ── Variants ── */}
        <Section
          title="Variants"
          description="Choose the visual style that matches the action's intent."
        >
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="success">Success</Button>
          <Button variant="warning">Warning</Button>
        </Section>

        {/* ── Sizes ── */}
        <Section
          title="Sizes"
          description="Three sizes to fit any context — sm for compact UIs, lg for prominent CTAs."
        >
          <Button variant="primary" size="sm">Small</Button>
          <Button variant="primary" size="md">Medium (default)</Button>
          <Button variant="primary" size="lg">Large</Button>
        </Section>

        {/* ── With Icons ── */}
        <Section
          title="With Icons"
          description="Use leftIcon and rightIcon to provide visual context alongside button labels."
        >
          <Button variant="primary" leftIcon={<HiPlus />}>Create New</Button>
          <Button variant="outline" leftIcon={<HiDownload />}>Export</Button>
          <Button variant="secondary" rightIcon={<HiArrowRight />}>Continue</Button>
          <Button variant="ghost" leftIcon={<HiPencil />}>Edit</Button>
          <Button variant="danger" leftIcon={<HiTrash />}>Delete</Button>
          <Button variant="success" leftIcon={<HiCheck />}>Approve</Button>
          <Button variant="outline" leftIcon={<HiShare />}>Share</Button>
        </Section>

        {/* ── Icon-only ── */}
        <Section
          title="Icon-only Buttons"
          description="Compact buttons for toolbars and action menus. Always provide aria-label."
        >
          <Button variant="primary" iconOnly size="sm" aria-label="Add"><HiPlus /></Button>
          <Button variant="outline" iconOnly size="sm" aria-label="Edit"><HiPencil /></Button>
          <Button variant="ghost" iconOnly size="sm" aria-label="Settings"><HiCog /></Button>
          <Button variant="danger" iconOnly size="sm" aria-label="Delete"><HiTrash /></Button>
          <Button variant="primary" iconOnly size="md" aria-label="Add"><HiPlus /></Button>
          <Button variant="outline" iconOnly size="md" aria-label="Download"><HiDownload /></Button>
          <Button variant="primary" iconOnly size="lg" aria-label="Add"><HiPlus /></Button>
        </Section>

        {/* ── Shapes ── */}
        <Section
          title="Shapes"
          description="Control border radius — default, pill (fully rounded), or square (no radius)."
        >
          <Button variant="primary" shape="default">Default</Button>
          <Button variant="primary" shape="pill">Pill</Button>
          <Button variant="primary" shape="square">Square</Button>
          <Button variant="outline" shape="pill" leftIcon={<HiArrowRight />}>Pill + Icon</Button>
          <Button variant="secondary" shape="pill" iconOnly aria-label="Add"><HiPlus /></Button>
        </Section>

        {/* ── Loading States ── */}
        <Section
          title="Loading States"
          description="Button becomes non-interactive and shows a spinner when loading=true."
        >
          <Button variant="primary" loading>Saving</Button>
          <Button variant="primary" loading loadingText="Uploading...">Upload</Button>
          <Button variant="outline" loading>Processing</Button>
          <Button
            variant="primary"
            loading={loading}
            loadingText="Sending..."
            onClick={handleLoadingDemo}
          >
            Click to demo (2.5s)
          </Button>
        </Section>

        {/* ── Disabled ── */}
        <Section
          title="Disabled States"
          description="Disabled buttons prevent user interaction and communicate unavailability."
        >
          <Button variant="primary" disabled>Primary</Button>
          <Button variant="secondary" disabled>Secondary</Button>
          <Button variant="outline" disabled>Outline</Button>
          <Button variant="ghost" disabled>Ghost</Button>
          <Button variant="danger" disabled>Danger</Button>
        </Section>

        {/* ── Full Width ── */}
        <Section
          title="Full Width"
          description="Stretch the button to fill its container — useful inside forms and cards."
        >
          <div style={{ width: '100%' }}>
            <Button variant="primary" fullWidth leftIcon={<HiCheck />}>
              Submit Form
            </Button>
          </div>
          <div style={{ width: '100%' }}>
            <Button variant="outline" fullWidth>Cancel</Button>
          </div>
        </Section>

        {/* ── As Link ── */}
        <Section
          title="As Link"
          description="Render with anchor semantics while keeping button styling. Requires href."
        >
          <Button variant="primary" asLink href="/" shape="pill">Go Home</Button>
          <Button
            variant="outline"
            asLink
            href="https://github.com"
            target="_blank"
            rightIcon={<HiArrowRight />}
          >
            GitHub (new tab)
          </Button>
        </Section>

        {/* ── Footer ── */}
        <footer
          style={{
            marginTop: '4rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #e5e7eb',
            fontSize: '0.8125rem',
            color: '#9ca3af',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>@luxis-ui/react</span>
          <span>Component Showcase</span>
        </footer>
      </div>
    </main>
  );
}
