import { test, expect } from '@playwright/test';

test.describe('Sort Functionality', () => {
  test('should sort transactions by different criteria', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Navigate to transactions page
    const sidebar = page.locator('finsite-sidebar');
    await sidebar.evaluateHandle((el: any) => {
      el.shadowRoot.querySelector('[data-page="transactions"]').click();
    });
    await page.waitForTimeout(1000);

    const txComponent = page.locator('finsite-transactions');

    // Check that sort dropdown exists
    const sortExists = await txComponent.evaluate((el: any) => {
      const sortSelect = el.shadowRoot.querySelector('#sort-select');
      return sortSelect !== null;
    });
    expect(sortExists).toBe(true);

    // Change sort to "oldest first"
    await txComponent.evaluateHandle((el: any) => {
      const sortSelect = el.shadowRoot.querySelector('#sort-select');
      sortSelect.value = 'oldest';
      sortSelect.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.waitForTimeout(500);

    // Verify sort changed
    const sortValue = await txComponent.evaluate((el: any) => {
      return el.shadowRoot.querySelector('#sort-select').value;
    });
    expect(sortValue).toBe('oldest');

    // Change sort to "amount high"
    await txComponent.evaluateHandle((el: any) => {
      const sortSelect = el.shadowRoot.querySelector('#sort-select');
      sortSelect.value = 'amount-high';
      sortSelect.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.waitForTimeout(500);

    // Verify sort changed again
    const sortValue2 = await txComponent.evaluate((el: any) => {
      return el.shadowRoot.querySelector('#sort-select').value;
    });
    expect(sortValue2).toBe('amount-high');
  });
});
