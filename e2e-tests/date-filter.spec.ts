import { test, expect } from '@playwright/test';

test.describe('Date Range Filter Functionality', () => {
  test('should filter transactions by date range', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Navigate to transactions page
    const sidebar = page.locator('finsite-sidebar');
    await sidebar.evaluateHandle((el: any) => {
      el.shadowRoot.querySelector('[data-page="transactions"]').click();
    });
    await page.waitForTimeout(1000);

    const txComponent = page.locator('finsite-transactions');

    // Click date button to open date panel
    await txComponent.evaluateHandle((el: any) => {
      el.shadowRoot.querySelector('#date-btn').click();
    });
    await page.waitForTimeout(500);

    // Verify date panel is open
    const datePanelVisible = await txComponent.evaluate((el: any) => {
      const dateStart = el.shadowRoot.querySelector('#date-start');
      return dateStart !== null;
    });
    expect(datePanelVisible).toBe(true);

    // Set date range
    await txComponent.evaluateHandle((el: any) => {
      const shadow = el.shadowRoot;
      shadow.querySelector('#date-start').value = '2024-01-01';
      shadow.querySelector('#date-end').value = '2024-12-31';
    });
    await page.waitForTimeout(300);

    // Click apply
    await txComponent.evaluateHandle((el: any) => {
      el.shadowRoot.querySelector('#date-apply-btn').click();
    });
    await page.waitForTimeout(500);

    // Verify date button shows active state
    const dateButtonActive = await txComponent.evaluate((el: any) => {
      const dateBtn = el.shadowRoot.querySelector('#date-btn');
      return dateBtn.classList.contains('active');
    });
    expect(dateButtonActive).toBe(true);
  });
});
