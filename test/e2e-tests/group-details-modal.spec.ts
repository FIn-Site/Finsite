import { test, expect } from '@playwright/test';

test.describe('Group Details Modal Functionality', () => {
  test('should open group details when clicking a group card', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Navigate to categories page
    const sidebar = page.locator('finsite-sidebar');
    await sidebar.evaluateHandle((el: any) => {
      el.shadowRoot.querySelector('[data-page="categories"]').click();
    });
    await page.waitForTimeout(1000);

    const categoriesComponent = page.locator('finsite-categories');

    // Check if there are any group cards (excluding add-group-btn)
    const hasGroupCards = await categoriesComponent.evaluate((el: any) => {
      const cards = el.shadowRoot.querySelectorAll('finsite-category-chart');
      return cards.length > 0;
    });

    if (hasGroupCards) {
      // Click first group card
      await categoriesComponent.evaluateHandle((el: any) => {
        const firstCard = el.shadowRoot.querySelector('finsite-category-chart');
        firstCard.click();
      });
      await page.waitForTimeout(500);

      // Check if modal overlay exists
      const modalExists = await categoriesComponent.evaluate((el: any) => {
        const modal = el.shadowRoot.querySelector('#modal-overlay');
        return modal !== null;
      });
      expect(modalExists).toBe(true);
    } else {
      // No groups exist, just verify the page loaded correctly
      const addBtnExists = await categoriesComponent.evaluate((el: any) => {
        return el.shadowRoot.querySelector('#add-group-btn') !== null;
      });
      expect(addBtnExists).toBe(true);
    }
  });
});
