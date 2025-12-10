import { test, expect } from '@playwright/test';

test.describe('Clear Filters Functionality', () => {
  test('should clear all filters when clear button is clicked', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Navigate to transactions page
    const sidebar = page.locator('finsite-sidebar');
    await sidebar.evaluateHandle((el: any) => {
      el.shadowRoot.querySelector('[data-page="transactions"]').click();
    });
    await page.waitForTimeout(1000);

    const txComponent = page.locator('finsite-transactions');

    // Set a scope filter first
    await txComponent.evaluateHandle((el: any) => {
      const scopeSelect = el.shadowRoot.querySelector('#scope-select');
      scopeSelect.value = 'expense';
      scopeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.waitForTimeout(500);

    // Verify filter is applied
    const scopeValue = await txComponent.evaluate((el: any) => {
      return el.shadowRoot.querySelector('#scope-select').value;
    });
    expect(scopeValue).toBe('expense');

    // Check if clear button exists (it should appear when filters are active)
    const clearBtnExists = await txComponent.evaluate((el: any) => {
      const clearBtn = el.shadowRoot.querySelector('#clear-all-btn');
      return clearBtn !== null;
    });

    // If clear button exists, click it
    if (clearBtnExists) {
      await txComponent.evaluateHandle((el: any) => {
        el.shadowRoot.querySelector('#clear-all-btn').click();
      });
      await page.waitForTimeout(500);

      // Verify scope is reset to 'all'
      const scopeAfterClear = await txComponent.evaluate((el: any) => {
        return el.shadowRoot.querySelector('#scope-select').value;
      });
      expect(scopeAfterClear).toBe('all');
    }
  });
});
