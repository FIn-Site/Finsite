import { test, expect } from '@playwright/test';

test.describe('Add Subcategory Functionality', () => {
  test('should add a subcategory field in the create group form', async ({ page }) => {
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

    // Verify add subcategory button exists
    const addSubBtnExists = await categoriesComponent.evaluate((el: any) => {
      const addSubBtn = el.shadowRoot.querySelector('#add-subcategory-btn');
      return addSubBtn !== null;
    });
    expect(addSubBtnExists).toBe(true);

    // Click add subcategory button
    await categoriesComponent.evaluateHandle((el: any) => {
      el.shadowRoot.querySelector('#add-subcategory-btn').click();
    });
    await page.waitForTimeout(500);

    // Verify a new subcategory input field was added (correct class name)
    const subcategoryFieldAdded = await categoriesComponent.evaluate((el: any) => {
      const subcategoryInputs = el.shadowRoot.querySelectorAll('.new-subcategory-input');
      return subcategoryInputs.length > 0;
    });
    expect(subcategoryFieldAdded).toBe(true);
  });
});
