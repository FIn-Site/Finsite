import { test, expect } from '@playwright/test';

test.describe('Add Group Modal Functionality', () => {
  test('should open and close the add group modal', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Navigate to categories page
    const sidebar = page.locator('finsite-sidebar');
    await sidebar.evaluateHandle((el: any) => {
      el.shadowRoot.querySelector('[data-page="categories"]').click();
    });
    await page.waitForTimeout(1000);

    const categoriesComponent = page.locator('finsite-categories');

    // Click "Add New Group" button
    await categoriesComponent.evaluateHandle((el: any) => {
      el.shadowRoot.querySelector('#add-group-btn').click();
    });
    await page.waitForTimeout(500);

    // Verify modal is open (not hidden)
    const modalVisible = await categoriesComponent.evaluate((el: any) => {
      const modal = el.shadowRoot.querySelector('#add-group-modal-overlay');
      return modal && !modal.classList.contains('hidden');
    });
    expect(modalVisible).toBe(true);

    // Click cancel button to close modal
    await categoriesComponent.evaluateHandle((el: any) => {
      el.shadowRoot.querySelector('#cancel-add-group').click();
    });
    await page.waitForTimeout(500);

    // Verify modal is closed (hidden)
    const modalHidden = await categoriesComponent.evaluate((el: any) => {
      const modal = el.shadowRoot.querySelector('#add-group-modal-overlay');
      return modal && modal.classList.contains('hidden');
    });
    expect(modalHidden).toBe(true);

    // Open modal again
    await categoriesComponent.evaluateHandle((el: any) => {
      el.shadowRoot.querySelector('#add-group-btn').click();
    });
    await page.waitForTimeout(500);

    // Close using X button
    await categoriesComponent.evaluateHandle((el: any) => {
      el.shadowRoot.querySelector('#add-group-modal-close').click();
    });
    await page.waitForTimeout(500);

    // Verify modal is closed again
    const modalHiddenAgain = await categoriesComponent.evaluate((el: any) => {
      const modal = el.shadowRoot.querySelector('#add-group-modal-overlay');
      return modal && modal.classList.contains('hidden');
    });
    expect(modalHiddenAgain).toBe(true);
  });
});
