import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// Extract all paths from built sitemap.xml
function getSitemapPaths(): string[] {
  const sitemapPath = join(process.cwd(), '.next/server/app/sitemap.xml.body');
  if (existsSync(sitemapPath)) {
    const xml = readFileSync(sitemapPath, 'utf8');
    const matches = Array.from(xml.matchAll(/<loc>https?:\/\/[^/]+(\/[^<]*)<\/loc>/g));
    const paths = matches.map((m) => m[1] || '/').filter((p) => p.startsWith('/ui') || p.startsWith('/api-reference') || p.startsWith('/docs') || p === '/');
    return Array.from(new Set(paths));
  }
  // Fallback list of key sections if sitemap file is not present
  return [
    '/',
    '/ui',
    '/ui/docs',
    '/ui/docs/foundations/overview',
    '/ui/docs/foundations/design-tokens',
    '/ui/docs/foundations/component-index',
    '/ui/docs/foundations/accessibility',
    '/ui/docs/foundations/dark-mode',
    '/ui/docs/components/actions/button',
    '/ui/docs/components/forms/input',
    '/ui/docs/components/overlays/dialog',
    '/ui/docs/components/data-display/data-table',
    '/ui/docs/patterns/dashboards',
    '/ui/docs/examples',
    '/ui/docs/resources/changelog',
    '/ui/docs/resources/versioning',
    '/api-reference',
    '/api-reference/guides/quickstart',
    '/api-reference/guides/authentication',
    '/api-reference/policies/error-codes',
    '/api-reference/policies/versioning',
    '/api-reference/policies/deprecation',
    '/api-reference/policies/limits-and-quotas',
    '/api-reference/policies/security',
    '/api-reference/policies/changelog',
    '/docs',
    '/docs/getting-started',
    '/docs/project-structure',
    '/docs/architecture',
    '/docs/architecture/building-blocks',
    '/docs/architecture/plugin-contract',
    '/docs/architecture/runtime-view',
    '/docs/architecture/data-architecture',
    '/docs/architecture/deployment',
    '/docs/architecture/cross-cutting',
    '/docs/architecture/threat-model',
    '/docs/architecture/decisions',
    '/docs/architecture/quality-requirements',
    '/docs/architecture/risks-and-technical-debt',
    '/docs/architecture/glossary',
    '/docs/operations/deployment',
    '/docs/operations/backup-restore',
    '/docs/operations/key-rotation',
    '/docs/guides/building-a-feature',
    '/docs/guides/backend-conventions',
    '/docs/guides/ci',
    '/docs/apps/api-server',
    '/docs/apps/web-app',
    '/docs/packages/ui',
  ];
}

const allPaths = getSitemapPaths();

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'mobile', width: 360, height: 740 },
];

const THEMES = ['light', 'dark'] as const;

test.describe('Automated Documentation Crawl & Quality Audit', () => {
  for (const path of allPaths) {
    for (const theme of THEMES) {
      for (const vp of VIEWPORTS) {
        test(`${path} [${theme}] (${vp.name} ${vp.width}x${vp.height})`, async ({ page }) => {
          const consoleErrors: string[] = [];
          const failedRequests: string[] = [];

          page.on('console', (msg) => {
            if (msg.type() === 'error') {
              consoleErrors.push(msg.text());
            }
          });

          page.on('requestfailed', (req) => {
            // Ignore analytics or external tracking if any
            if (!req.url().includes('google-analytics')) {
              failedRequests.push(`${req.method()} ${req.url()}: ${req.failure()?.errorText}`);
            }
          });

          await page.setViewportSize({ width: vp.width, height: vp.height });
          await page.emulateMedia({ colorScheme: theme });

          await page.addInitScript((t) => {
            try {
              localStorage.setItem('theme', t);
            } catch (_) {}
            if (t === 'dark') {
              document.documentElement.classList.add('dark');
              document.documentElement.setAttribute('data-theme', 'dark');
            } else {
              document.documentElement.classList.remove('dark');
              document.documentElement.removeAttribute('data-theme');
            }
          }, theme);

          const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
          expect(response?.status(), `Page ${path} should respond with 200 OK`).toBe(200);

          // Give a brief tick for DOM hydration to complete
          await page.waitForTimeout(200);

          // Force dark class if dark theme to verify both media query and manual class
          if (theme === 'dark') {
            await page.evaluate(() => {
              document.documentElement.classList.add('dark');
              document.documentElement.setAttribute('data-theme', 'dark');
            });
          } else {
            await page.evaluate(() => {
              document.documentElement.classList.remove('dark');
              document.documentElement.removeAttribute('data-theme');
            });
          }

          // 1. Verify no console errors or failed requests
          expect(consoleErrors, `Console errors found on ${path} [${theme}]`).toHaveLength(0);
          expect(failedRequests, `Failed network requests on ${path} [${theme}]`).toHaveLength(0);

          // 2. Verify no horizontal overflow
          const overflowInfo = await page.evaluate(() => {
            const doc = document.scrollingElement;
            const isOver = doc ? doc.scrollWidth > window.innerWidth + 1 : false;
            if (!isOver) return null;
            const all = Array.from(document.querySelectorAll('*'));
            const bad = all
              .filter((el) => {
                const style = window.getComputedStyle(el);
                return (
                  style.position !== 'fixed' &&
                  style.visibility !== 'hidden' &&
                  el.getBoundingClientRect().right > window.innerWidth + 1
                );
              })
              .map((el) => ({
                tag: el.tagName,
                cls: (el.className || '').toString().slice(0, 50),
                right: Math.round(el.getBoundingClientRect().right),
                width: Math.round(el.getBoundingClientRect().width),
              }))
              .slice(0, 5);
            return {
              scrollWidth: doc?.scrollWidth,
              innerWidth: window.innerWidth,
              bad,
            };
          });
          expect(overflowInfo, `Horizontal overflow detected on ${path} at ${vp.width}px: ${JSON.stringify(overflowInfo)}`).toBeNull();

          // 3. Verify no broken images
          const brokenImages = await page.evaluate(() => {
            const imgs = Array.from(document.querySelectorAll('img'));
            return imgs
              .filter((img) => !img.complete || img.naturalWidth === 0)
              .map((img) => img.src || img.getAttribute('src') || 'unknown image');
          });
          expect(brokenImages, `Broken images detected on ${path}`).toHaveLength(0);

          // 4. In-page anchors resolve (exclude illustrative demo links inside .not-prose)
          const brokenAnchors = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a[href^="#"]'));
            const broken: string[] = [];
            for (const a of links) {
              if (a.closest('.not-prose') || a.getAttribute('role') === 'button' || a.closest('[data-slot="button"]')) {
                continue;
              }
              const href = a.getAttribute('href');
              if (href && href.length > 1) {
                const targetId = decodeURIComponent(href.slice(1));
                const target = document.getElementById(targetId) || document.getElementsByName(targetId)[0];
                if (!target) {
                  broken.push(href);
                }
              }
            }
            return broken;
          });
          expect(brokenAnchors, `Broken in-page anchor links on ${path}`).toHaveLength(0);

          // 5. ComponentPreview checks
          const previewIssues = await page.evaluate(() => {
            const previews = Array.from(document.querySelectorAll('[data-slot="component-preview"]'));
            // If page has component previews, check each has content in its container
            const emptyPreviews: number[] = [];
            previews.forEach((p, idx) => {
              if (p.textContent?.trim().length === 0) {
                emptyPreviews.push(idx);
              }
            });
            return emptyPreviews;
          });
          expect(previewIssues, `Empty ComponentPreview found on ${path}`).toHaveLength(0);

          // 6. Axe Core Accessibility Audit (WCAG 2.2 AA)
          const axeResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
            .exclude('.shiki') // Exclude Shiki syntax highlighter code spans
            .disableRules(['heading-order']) // heading order may vary across complex Fumadocs layouts
            .analyze();

          const violations = axeResults.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            description: v.description,
            nodes: v.nodes.map((n) => ({
              target: n.target,
              html: n.html,
              summary: n.failureSummary,
            })),
          }));

          expect(
            violations,
            `Axe WCAG violations on ${path} [${theme} ${vp.name}]: ${JSON.stringify(violations, null, 2)}`
          ).toHaveLength(0);
        });
      }
    }
  }
});
