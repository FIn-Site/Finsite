import { test, expect } from '@playwright/test';

test.describe('Edit Multiple Mode Functionality', () => {
  test('should toggle edit multiple mode', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Navigate to transactions page
    const sidebar = page.locator('finsite-sidebar');
    await sidebar.evaluateHandle((el: any) => {
      el.shadowRoot.querySelector('[data-page="transactions"]').click();
    });
    await page.waitForTimeout(1000);

    const txComponent = page.locator('finsite-transactions');

    // Check that edit multiple button exists
    const editBtnExists = await txComponent.evaluate((el: any) => {
      const editBtn = el.shadowRoot.querySelector('#edit-multiple-btn');
      return editBtn !== null;
    });
    expect(editBtnExists).toBe(true);

    // Click edit multiple button to enable mode
    await txComponent.evaluateHandle((el: any) => {
      el.shadowRoot.querySelector('#edit-multiple-btn').click();
    });
    await page.waitForTimeout(500);

    // Verify button is now active
    const isActive = await txComponent.evaluate((el: any) => {
      const editBtn = el.shadowRoot.querySelector('#edit-multiple-btn');
      return editBtn.classList.contains('active');
    });
    expect(isActive).toBe(true);

    // Click again to disable mode
    await txComponent.evaluateHandle((el: any) => {
      el.shadowRoot.querySelector('#edit-multiple-btn').click();
    });
    await page.waitForTimeout(500);

    // Verify button is no longer active
    const isInactive = await txComponent.evaluate((el: any) => {
      const editBtn = el.shadowRoot.querySelector('#edit-multiple-btn');
      return !editBtn.classList.contains('active');
    });
    expect(isInactive).toBe(true);
  });
});
