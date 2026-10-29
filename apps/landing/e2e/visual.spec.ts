import { test, expect } from '@playwright/test';

const CORE_COMPONENTS = [
  { name: 'button', path: '/ui/docs/components/actions/button' },
  { name: 'dialog', path: '/ui/docs/components/overlays/dialog' },
  { name: 'data-table', path: '/ui/docs/components/data-display/data-table' },
  { name: 'cartesian', path: '/ui/docs/charts/cartesian' },
  { name: 'permission-matrix', path: '/ui/docs/widgets/permission-matrix' },
  { name: 'kanban-board', path: '/ui/docs/widgets/kanban-board' },
];

test.describe('Visual Regression Baseline Tests', () => {
  for (const comp of CORE_COMPONENTS) {
    for (const theme of ['light', 'dark'] as const) {
      test(`${comp.name} [${theme}]`, async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.emulateMedia({ colorScheme: theme });

        await page.goto(comp.path, { waitUntil: 'domcontentloaded' });

        if (theme === 'dark') {
          await page.evaluate(() => {
            document.documentElement.classList.add('dark');
            document.documentElement.setAttribute('data-theme', 'dark');
          });
        }

        // Locate the lead ComponentPreview
        const leadPreview = page.locator('[data-slot="component-preview"]').first();
        await expect(leadPreview).toBeVisible();

        // Baseline screenshot check
        await expect(leadPreview).toHaveScreenshot(`${comp.name}-${theme}.png`, {
          maxDiffPixelRatio: 0.05,
        });
      });
    }
  }
});
