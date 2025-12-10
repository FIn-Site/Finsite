import { test, expect } from '@playwright/test';

test.describe('Add Transaction Flow', () => {
  test('should add a new transaction and display it in the list', async ({ page }) => {
    await page.goto('/');
    
    // Wait for app to load
    await page.waitForTimeout(1000);
    
    // Navigate to transactions page by clicking in shadow DOM
    const sidebar = page.locator('finsite-sidebar');
    await sidebar.evaluateHandle((el: any) => {
      const shadowRoot = el.shadowRoot;
      const transactionsLink = shadowRoot.querySelector('[data-page="transactions"]');
      transactionsLink.click();
    });
    
    // Wait for transactions page to load
    await page.waitForTimeout(1000);
    
    // Open the add transaction modal via shadow DOM
    const transactionsComponent = page.locator('finsite-transactions');
    await transactionsComponent.evaluateHandle((el: any) => {
      const shadowRoot = el.shadowRoot;
      const addButton = shadowRoot.querySelector('#add-transaction-btn');
      addButton.click();
    });
    
    // Wait for modal
    await page.waitForTimeout(500);
    
    // Fill out the form via shadow DOM
    await transactionsComponent.evaluateHandle((el: any) => {
      const shadowRoot = el.shadowRoot;
      const today = new Date().toISOString().split('T')[0];
      
      shadowRoot.querySelector('#tx-amount').value = '50.00';
      shadowRoot.querySelector('#tx-date').value = today;
      shadowRoot.querySelector('#tx-group').value = 'household';
      shadowRoot.querySelector('#tx-category').value = 'groceries';
      shadowRoot.querySelector('#tx-merchant').value = 'Test Store';
      
      // Submit the form
      shadowRoot.querySelector('#transaction-form').requestSubmit();
    });
    
    // Wait for transaction to be added
    await page.waitForTimeout(1500);
    
    // Verify transaction was added by checking the component
    const hasTransaction = await transactionsComponent.evaluate((el: any) => {
      const shadowRoot = el.shadowRoot;
      const rows = shadowRoot.querySelectorAll('.transaction-row');
      return rows.length > 0;
    });
    
    expect(hasTransaction).toBe(true);
  });
});
