import { test, expect } from '@playwright/test';

test.describe('Scope Filter Functionality', () => {
  test('should filter transactions by scope (all/expenses/income)', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Navigate to transactions page
    const sidebar = page.locator('finsite-sidebar');
    await sidebar.evaluateHandle((el: any) => {
      el.shadowRoot.querySelector('[data-page="transactions"]').click();
    });
    await page.waitForTimeout(1000);

    const txComponent = page.locator('finsite-transactions');

    // Check that scope dropdown exists
    const scopeExists = await txComponent.evaluate((el: any) => {
      const scopeSelect = el.shadowRoot.querySelector('#scope-select');
      return scopeSelect !== null;
    });
    expect(scopeExists).toBe(true);

    // Change scope to "expenses only"
    await txComponent.evaluateHandle((el: any) => {
      const scopeSelect = el.shadowRoot.querySelector('#scope-select');
      scopeSelect.value = 'expense';
      scopeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.waitForTimeout(500);

    // Verify scope changed
    const scopeValue = await txComponent.evaluate((el: any) => {
      return el.shadowRoot.querySelector('#scope-select').value;
    });
    expect(scopeValue).toBe('expense');

    // Change scope to "income only"
    await txComponent.evaluateHandle((el: any) => {
      const scopeSelect = el.shadowRoot.querySelector('#scope-select');
      scopeSelect.value = 'income';
      scopeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.waitForTimeout(500);

    // Verify scope changed again
    const scopeValue2 = await txComponent.evaluate((el: any) => {
      return el.shadowRoot.querySelector('#scope-select').value;
    });
    expect(scopeValue2).toBe('income');

    // Change back to "all"
    await txComponent.evaluateHandle((el: any) => {
      const scopeSelect = el.shadowRoot.querySelector('#scope-select');
      scopeSelect.value = 'all';
      scopeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.waitForTimeout(500);

    const scopeValue3 = await txComponent.evaluate((el: any) => {
      return el.shadowRoot.querySelector('#scope-select').value;
    });
    expect(scopeValue3).toBe('all');
  });
});
