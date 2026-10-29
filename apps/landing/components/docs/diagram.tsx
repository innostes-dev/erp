'use client';

import React, { useEffect, useId, useState } from 'react';
import { useTheme } from 'next-themes';

interface DiagramProps {
  children?: React.ReactNode;
  code?: string;
  caption?: string;
  className?: string;
}

/**
 * Diagram renders client-side Mermaid diagrams themed for light and dark modes.
 * Ensures diagrams are scrollable horizontally without breaking page layouts at 360px.
 */
export function Diagram({ children, code, caption, className = '' }: DiagramProps) {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();
  const rawId = useId().replace(/:/g, '_');
  const id = `diag_${rawId}`;

  // Extract raw chart string from children or code prop
  let rawChart = '';
  if (typeof children === 'string') {
    rawChart = children;
  } else if (code) {
    rawChart = code;
  } else if (React.isValidElement(children)) {
    // If wrapped in <pre><code>...</code></pre>
    const props = (children as React.ReactElement<any>).props;
    if (props && typeof props.children === 'string') {
      rawChart = props.children;
    }
  }

  useEffect(() => {
    let isMounted = true;
    const chartContent = rawChart.trim();
    if (!chartContent) return;

    async function renderMermaid() {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: resolvedTheme === 'dark' ? 'dark' : 'neutral',
          securityLevel: 'loose',
          fontFamily: 'inherit',
          flowchart: {
            useMaxWidth: false,
            htmlLabels: true,
          },
          sequence: {
            useMaxWidth: false,
          },
        });

        // Use a unique element ID for mermaid rendering
        const { svg: renderedSvg } = await mermaid.render(`mermaid_${id}`, chartContent);
        if (isMounted) {
          setSvg(renderedSvg);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Failed to render diagram');
        }
      }
    }

    renderMermaid();
    return () => {
      isMounted = false;
    };
  }, [rawChart, resolvedTheme, id]);

  return (
    <figure className={`my-6 rounded-lg border border-fd-border bg-fd-card/50 p-4 ${className}`}>
      <div className="overflow-x-auto max-w-full flex justify-center py-2">
        {error ? (
          <div className="text-sm text-red-500 font-mono p-3 bg-red-500/10 rounded">
            Diagram syntax error: {error}
          </div>
        ) : svg ? (
          <div
            className="mermaid-svg-container max-w-full"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : (
          <div className="text-sm text-fd-muted-foreground animate-pulse py-8 text-center">
            Rendering diagram...
          </div>
        )}
      </div>
      {caption && (
        <figcaption className="mt-3 text-center text-xs text-fd-muted-foreground font-medium border-t border-fd-border/50 pt-2">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
