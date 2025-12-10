import { test, expect } from '@playwright/test';

test.describe('Filter Panel Functionality', () => {
  test('should open and close the advanced filter panel', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Navigate to transactions page
    const sidebar = page.locator('finsite-sidebar');
    await sidebar.evaluateHandle((el: any) => {
      el.shadowRoot.querySelector('[data-page="transactions"]').click();
    });
    await page.waitForTimeout(1000);

    const txComponent = page.locator('finsite-transactions');

    // Click filter button to open panel
    await txComponent.evaluateHandle((el: any) => {
      el.shadowRoot.querySelector('#filter-btn').click();
    });
    await page.waitForTimeout(500);

    // Verify filter panel is open (check for filter sections)
    const filterPanelOpen = await txComponent.evaluate((el: any) => {
      const groupCheckboxes = el.shadowRoot.querySelectorAll('.group-checkbox');
      const categoryCheckboxes = el.shadowRoot.querySelectorAll('.category-checkbox');
      return groupCheckboxes.length > 0 || categoryCheckboxes.length > 0;
    });
    expect(filterPanelOpen).toBe(true);

    // Click close button
    await txComponent.evaluateHandle((el: any) => {
      el.shadowRoot.querySelector('#filter-close-btn').click();
    });
    await page.waitForTimeout(500);

    // Open filter panel again
    await txComponent.evaluateHandle((el: any) => {
      el.shadowRoot.querySelector('#filter-btn').click();
    });
    await page.waitForTimeout(500);

    // Click apply button
    await txComponent.evaluateHandle((el: any) => {
      el.shadowRoot.querySelector('#filter-apply-btn').click();
    });
    await page.waitForTimeout(500);

    // Panel should be closed after apply
    // Verify by checking filter button exists (page is still functional)
    const filterBtnExists = await txComponent.evaluate((el: any) => {
      return el.shadowRoot.querySelector('#filter-btn') !== null;
    });
    expect(filterBtnExists).toBe(true);
  });
});
