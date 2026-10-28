import { ImageResponse } from 'next/og';
import { type NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || 'innostes UI';
  const section = searchParams.get('section') || 'Design System';
  const description =
    searchParams.get('description') ||
    'Production-grade design system and React component library for enterprise web applications.';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#090d16',
          color: '#f8fafc',
          padding: '60px 80px',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '20px',
              color: '#ffffff',
            }}
          >
            I
          </div>
          <span
            style={{
              fontSize: '20px',
              fontWeight: '600',
              letterSpacing: '0.05em',
              color: '#94a3b8',
              textTransform: 'uppercase',
            }}
          >
            {section}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h1
            style={{
              fontSize: '56px',
              fontWeight: '800',
              lineHeight: '1.1',
              letterSpacing: '-0.02em',
              color: '#ffffff',
              margin: 0,
            }}
          >
            {title}
          </h1>
          <p
            style={{
              fontSize: '24px',
              lineHeight: '1.4',
              color: '#94a3b8',
              margin: 0,
              maxWidth: '900px',
            }}
          >
            {description}
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid #1e293b',
            paddingTop: '24px',
          }}
        >
          <span style={{ fontSize: '18px', color: '#64748b' }}>
            innostes.com/ui/docs
          </span>
          <span
            style={{
              fontSize: '16px',
              color: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              padding: '6px 16px',
              borderRadius: '9999px',
              fontWeight: '500',
            }}
          >
            WCAG 2.2 AA • Accessible
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
