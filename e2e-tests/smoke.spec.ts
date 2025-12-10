import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('should load the application successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check page title
    await expect(page).toHaveTitle(/FinSite/i);
    
    // Wait for app to load
    await page.waitForTimeout(1000);
    
    // Check that the main app container is visible
    const app = page.locator('#app');
    await expect(app).toBeVisible();
    
    // Check sidebar component exists
    const sidebar = page.locator('finsite-sidebar');
    await expect(sidebar).toBeVisible();
  });
});
