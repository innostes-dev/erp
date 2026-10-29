import { test, expect } from '@playwright/test';

test.describe('Keyboard Interaction Smoke Tests', () => {
  test('Button & Action keyboard activation', async ({ page }) => {
    await page.goto('/ui/docs/components/actions/button');
    const leadButton = page.locator('button:has-text("Primary action")').first();
    await leadButton.waitFor({ state: 'visible' });

    await leadButton.focus();
    await expect(leadButton).toBeFocused();

    await page.keyboard.press('Space');
    await page.keyboard.press('Enter');
  });

  test('Dialog overlay: keyboard open, trap, and Escape dismissal', async ({ page }) => {
    await page.goto('/ui/docs/components/overlays/dialog');
    const trigger = page.locator('button:has-text("Edit procurement profile")').first();
    await trigger.waitFor({ state: 'visible' });
    await trigger.focus();
    await expect(trigger).toBeFocused();

    await page.keyboard.press('Enter');

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
  });

  test('AlertDialog: keyboard open and Cancel dismissal', async ({ page }) => {
    await page.goto('/ui/docs/components/overlays/alert-dialog');
    const trigger = page.locator('button:has-text("Void tax invoice")').first();
    await trigger.waitFor({ state: 'visible' });
    await trigger.focus();
    await page.keyboard.press('Enter');

    const alertdialog = page.locator('[role="alertdialog"]');
    await expect(alertdialog).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(alertdialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
  });

  test('DropdownMenu: open with Enter, arrow navigation, Escape dismissal', async ({ page }) => {
    await page.goto('/ui/docs/components/overlays/dropdown-menu');
    const trigger = page.locator('button:has-text("Ada Lovelace")').first();
    await trigger.waitFor({ state: 'visible' });
    await trigger.focus();

    await page.keyboard.press('Enter');
    const menu = page.locator('[role="menu"]');
    await expect(menu).toBeVisible();

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');

    await page.keyboard.press('Escape');
    await expect(menu).not.toBeVisible();
    await expect(trigger).toBeFocused();
  });

  test('Tabs navigation: arrow keys cycle active tab', async ({ page }) => {
    await page.goto('/ui/docs/components/navigation/tabs');
    const tabOverview = page.locator('button[role="tab"]:has-text("Overview")').first();
    await tabOverview.waitFor({ state: 'visible' });
    await tabOverview.focus();
    await expect(tabOverview).toBeFocused();

    await page.keyboard.press('ArrowRight');
    const tabInventory = page.locator('button[role="tab"]:has-text("Orders"), button[role="tab"]:has-text("Inventory"), button[role="tab"]:has-text("Analytics")').first();
    await expect(tabInventory).toBeFocused();
  });

  test('Select component: Space to open, arrow navigation, Enter to select', async ({ page }) => {
    await page.goto('/ui/docs/components/forms/select');
    const trigger = page.locator('[role="combobox"]').first();
    await trigger.waitFor({ state: 'visible' });
    await trigger.focus();
    await expect(trigger).toBeFocused();

    await page.keyboard.press('Space');
    const listbox = page.locator('[role="listbox"]');
    await expect(listbox).toBeVisible();

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Escape');
    await expect(listbox).not.toBeVisible();
  });
});
