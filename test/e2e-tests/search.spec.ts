import { test, expect } from '@playwright/test';

test.describe('Search Functionality', () => {
  test('should open and close search bar', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Navigate to transactions page
    const sidebar = page.locator('finsite-sidebar');
    await sidebar.evaluateHandle((el: any) => {
      el.shadowRoot.querySelector('[data-page="transactions"]').click();
    });
    await page.waitForTimeout(1000);

    const txComponent = page.locator('finsite-transactions');

    // Click search button to open search bar
    await txComponent.evaluateHandle((el: any) => {
      el.shadowRoot.querySelector('#search-btn').click();
    });
    await page.waitForTimeout(300);

    // Verify search input is visible
    const searchInputVisible = await txComponent.evaluate((el: any) => {
      const searchInput = el.shadowRoot.querySelector('#search-input');
      return searchInput !== null;
    });
    expect(searchInputVisible).toBe(true);

    // Type in search box
    await txComponent.evaluateHandle((el: any) => {
      const searchInput = el.shadowRoot.querySelector('#search-input');
      searchInput.value = 'test query';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForTimeout(300);

    // Verify the search value was set
    const searchValue = await txComponent.evaluate((el: any) => {
      const searchInput = el.shadowRoot.querySelector('#search-input');
      return searchInput.value;
    });
    expect(searchValue).toBe('test query');

    // Close search bar
    await txComponent.evaluateHandle((el: any) => {
      el.shadowRoot.querySelector('#search-close-btn').click();
    });
    await page.waitForTimeout(300);

    // Verify search was cleared
    const searchCleared = await txComponent.evaluate((el: any) => {
      const searchInput = el.shadowRoot.querySelector('#search-input');
      return searchInput === null || searchInput.value === '';
    });
    expect(searchCleared).toBe(true);
  });
});