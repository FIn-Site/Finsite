import { test, expect } from '@playwright/test';

test.describe('Navigation Functionality', () => {
  test('should navigate between dashboard and transactions pages', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    const sidebar = page.locator('finsite-sidebar');

    // Verify we start on dashboard
    const dashboard = page.locator('finsite-dashboard');
    await expect(dashboard).toBeVisible();

    // Navigate to transactions page
    await sidebar.evaluateHandle((el: any) => {
      el.shadowRoot.querySelector('[data-page="transactions"]').click();
    });
    await page.waitForTimeout(1000);

    // Verify transactions page is visible
    const transactions = page.locator('finsite-transactions');
    await expect(transactions).toBeVisible();

    // Navigate back to dashboard
    await sidebar.evaluateHandle((el: any) => {
      el.shadowRoot.querySelector('[data-page="dashboard"]').click();
    });
    await page.waitForTimeout(1000);

    // Verify dashboard is visible again
    await expect(dashboard).toBeVisible();
  });
});
