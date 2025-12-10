import { test, expect } from '@playwright/test';

test.describe('Form Validation Functionality', () => {
  test('should require mandatory fields before submitting', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Navigate to transactions page
    const sidebar = page.locator('finsite-sidebar');
    await sidebar.evaluateHandle((el: any) => {
      el.shadowRoot.querySelector('[data-page="transactions"]').click();
    });
    await page.waitForTimeout(1000);

    const txComponent = page.locator('finsite-transactions');

    // Open modal
    await txComponent.evaluateHandle((el: any) => {
      el.shadowRoot.querySelector('#add-transaction-btn').click();
    });
    await page.waitForTimeout(500);

    // Verify form exists
    const formExists = await txComponent.evaluate((el: any) => {
      const form = el.shadowRoot.querySelector('#transaction-form');
      return form !== null;
    });
    expect(formExists).toBe(true);

    // Check that required fields exist
    const requiredFieldsExist = await txComponent.evaluate((el: any) => {
      const shadow = el.shadowRoot;
      const amount = shadow.querySelector('#tx-amount');
      const date = shadow.querySelector('#tx-date');
      const group = shadow.querySelector('#tx-group');
      const category = shadow.querySelector('#tx-category');
      return amount !== null && date !== null && group !== null && category !== null;
    });
    expect(requiredFieldsExist).toBe(true);

    // Verify amount field has required attribute
    const amountRequired = await txComponent.evaluate((el: any) => {
      const amount = el.shadowRoot.querySelector('#tx-amount');
      return amount.hasAttribute('required');
    });
    expect(amountRequired).toBe(true);

    // Verify date field has required attribute
    const dateRequired = await txComponent.evaluate((el: any) => {
      const date = el.shadowRoot.querySelector('#tx-date');
      return date.hasAttribute('required');
    });
    expect(dateRequired).toBe(true);
  });
});
