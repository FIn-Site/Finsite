import { test, expect } from '@playwright/test';

test.describe('Sidebar Collapse Functionality', () => {
  test('should toggle sidebar collapse state', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    const sidebar = page.locator('finsite-sidebar');

    // Verify sidebar is initially expanded (not collapsed)
    const initiallyExpanded = await sidebar.evaluate((el: any) => {
      return !el.classList.contains('collapsed');
    });
    expect(initiallyExpanded).toBe(true);

    // Click collapse button
    await sidebar.evaluateHandle((el: any) => {
      el.shadowRoot.querySelector('#collapse-btn').click();
    });
    await page.waitForTimeout(500);

    // Verify sidebar is now collapsed
    const isCollapsed = await sidebar.evaluate((el: any) => {
      return el.classList.contains('collapsed');
    });
    expect(isCollapsed).toBe(true);

    // Click collapse button again to expand
    await sidebar.evaluateHandle((el: any) => {
      el.shadowRoot.querySelector('#collapse-btn').click();
    });
    await page.waitForTimeout(500);

    // Verify sidebar is expanded again
    const isExpandedAgain = await sidebar.evaluate((el: any) => {
      return !el.classList.contains('collapsed');
    });
    expect(isExpandedAgain).toBe(true);
  });
});
