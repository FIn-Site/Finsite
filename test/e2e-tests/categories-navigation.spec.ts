import { test, expect } from '@playwright/test';

test.describe('Categories Navigation', () => {
  test('should navigate to categories page', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Navigate to categories page
    const sidebar = page.locator('finsite-sidebar');
    await sidebar.evaluateHandle((el: any) => {
      el.shadowRoot.querySelector('[data-page="categories"]').click();
    });
    await page.waitForTimeout(1000);

    // Verify categories component is visible
    const categories = page.locator('finsite-categories');
    await expect(categories).toBeVisible();
  });
});
