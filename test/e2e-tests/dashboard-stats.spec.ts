import { test, expect } from '@playwright/test';

test.describe('Dashboard Stats Functionality', () => {
  test('should display all stat cards on dashboard', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    const dashboard = page.locator('finsite-dashboard');

    // Verify dashboard is visible
    await expect(dashboard).toBeVisible();

    // Check that Total Spent stat card exists
    const totalSpentExists = await dashboard.evaluate((el: any) => {
      const stat = el.shadowRoot.querySelector('[data-field="totalSpent"]');
      return stat !== null;
    });
    expect(totalSpentExists).toBe(true);

    // Check that Weekly Count stat card exists
    const weeklyCountExists = await dashboard.evaluate((el: any) => {
      const stat = el.shadowRoot.querySelector('[data-field="weeklyCount"]');
      return stat !== null;
    });
    expect(weeklyCountExists).toBe(true);

    // Check that Monthly Spending stat card exists
    const monthlySpendingExists = await dashboard.evaluate((el: any) => {
      const stat = el.shadowRoot.querySelector('[data-field="monthlySpending"]');
      return stat !== null;
    });
    expect(monthlySpendingExists).toBe(true);

    // Check that Monthly Change stat exists
    const monthlyChangeExists = await dashboard.evaluate((el: any) => {
      const stat = el.shadowRoot.querySelector('[data-field="monthlyChange"]');
      return stat !== null;
    });
    expect(monthlyChangeExists).toBe(true);
  });
});
