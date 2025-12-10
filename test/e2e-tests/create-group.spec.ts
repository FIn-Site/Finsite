import { test, expect } from '@playwright/test';

test.describe('Create Group Functionality', () => {
  test('should fill out the create group form', async ({ page }) => {
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

    // Verify form elements exist
    const formExists = await categoriesComponent.evaluate((el: any) => {
      const shadow = el.shadowRoot;
      const form = shadow.querySelector('#add-group-form');
      const nameInput = shadow.querySelector('#new-group-name');
      const createBtn = shadow.querySelector('#create-group-btn');
      return form !== null && nameInput !== null && createBtn !== null;
    });
    expect(formExists).toBe(true);

    // Fill in group name
    await categoriesComponent.evaluateHandle((el: any) => {
      const nameInput = el.shadowRoot.querySelector('#new-group-name');
      nameInput.value = 'Test Group';
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForTimeout(300);

    // Verify the name was entered
    const nameEntered = await categoriesComponent.evaluate((el: any) => {
      const nameInput = el.shadowRoot.querySelector('#new-group-name');
      return nameInput.value === 'Test Group';
    });
    expect(nameEntered).toBe(true);
  });
});
