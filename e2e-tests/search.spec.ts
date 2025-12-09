import { test, expect } from '@playwright/test';

test.describe('Search Functionality', () => {
  test('should filter transactions by search query', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Navigate to transactions page
    const sidebar = page.locator('finsite-sidebar');
    await sidebar.evaluateHandle((el: any) => {
      el.shadowRoot.querySelector('[data-page="transactions"]').click();
    });
    await page.waitForTimeout(1000);

    // First add a transaction so we have something to search
    const txComponent = page.locator('finsite-transactions');
    await txComponent.evaluateHandle((el: any) => {
      el.shadowRoot.querySelector('#add-transaction-btn').click();
    });
    await page.waitForTimeout(500);

    await txComponent.evaluateHandle((el: any) => {
      const shadow = el.shadowRoot;
      const today = new Date().toISOString().split('T')[0];
      shadow.querySelector('#tx-amount').value = '25.00';
      shadow.querySelector('#tx-date').value = today;
      shadow.querySelector('#tx-group').value = 'household';
      shadow.querySelector('#tx-category').value = 'groceries';
      shadow.querySelector('#tx-merchant').value = 'UniqueTestMerchant';
      shadow.querySelector('#transaction-form').requestSubmit();
    });
    await page.waitForTimeout(1000);

    // Click search button to open search bar
    await txComponent.evaluateHandle((el: any) => {
      el.shadowRoot.querySelector('#search-btn').click();
    });
    await page.waitForTimeout(300);

    // Type in search box
    await txComponent.evaluateHandle((el: any) => {
      const searchInput = el.shadowRoot.querySelector('#search-input');
      searchInput.value = 'UniqueTestMerchant';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForTimeout(500);

    // Verify filtered results show our transaction
    const hasResult = await txComponent.evaluate((el: any) => {
      const rows = el.shadowRoot.querySelectorAll('.transaction-row');
      return rows.length > 0;
    });

    expect(hasResult).toBe(true);
  });
});
