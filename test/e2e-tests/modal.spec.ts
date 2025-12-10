import { test, expect } from '@playwright/test';

test.describe('Modal Functionality', () => {
  test('should open and close the add transaction modal', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Navigate to transactions page
    const sidebar = page.locator('finsite-sidebar');
    await sidebar.evaluateHandle((el: any) => {
      el.shadowRoot.querySelector('[data-page="transactions"]').click();
    });
    await page.waitForTimeout(1000);

    const txComponent = page.locator('finsite-transactions');

    // Click add transaction button to open modal
    await txComponent.evaluateHandle((el: any) => {
      el.shadowRoot.querySelector('#add-transaction-btn').click();
    });
    await page.waitForTimeout(500);

    // Verify modal is open (not hidden)
    const modalVisible = await txComponent.evaluate((el: any) => {
      const modal = el.shadowRoot.querySelector('#modal-overlay');
      return modal && !modal.classList.contains('hidden');
    });
    expect(modalVisible).toBe(true);

    // Click cancel button to close modal
    await txComponent.evaluateHandle((el: any) => {
      el.shadowRoot.querySelector('#modal-cancel-btn').click();
    });
    await page.waitForTimeout(500);

    // Verify modal is closed (hidden)
    const modalHidden = await txComponent.evaluate((el: any) => {
      const modal = el.shadowRoot.querySelector('#modal-overlay');
      return modal && modal.classList.contains('hidden');
    });
    expect(modalHidden).toBe(true);

    // Open modal again
    await txComponent.evaluateHandle((el: any) => {
      el.shadowRoot.querySelector('#add-transaction-btn').click();
    });
    await page.waitForTimeout(500);

    // Close using X button
    await txComponent.evaluateHandle((el: any) => {
      el.shadowRoot.querySelector('#modal-close-btn').click();
    });
    await page.waitForTimeout(500);

    // Verify modal is closed again
    const modalHiddenAgain = await txComponent.evaluate((el: any) => {
      const modal = el.shadowRoot.querySelector('#modal-overlay');
      return modal && modal.classList.contains('hidden');
    });
    expect(modalHiddenAgain).toBe(true);
  });
});
