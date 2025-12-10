import { test, expect } from '@playwright/test';

test.describe('Chart Rendering', () => {
  test('should render chart on dashboard', async ({ page }) => {
    await page.goto('/');
    
    // Make sure we're on dashboard
    await page.locator('[data-testid="nav-dashboard"]').click();
    
    // Wait for page to load
    await page.waitForTimeout(1000);
    
    // Check that chart container exists and is visible
    const chart = page.locator('[data-testid="summary-chart"]');
    await expect(chart).toBeVisible();
    
    // Verify chart has rendered (check it has some height)
    const boundingBox = await chart.boundingBox();
    expect(boundingBox).not.toBeNull();
    expect(boundingBox!.height).toBeGreaterThan(0);
  });
});
