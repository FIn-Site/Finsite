/**
 * FinSiteController - Coordinates between Model and View
 * Handles user interactions and application logic
 */
export class FinSiteController {
  constructor(model, view) {
    this.model = model;
    this.view = view;

    if (typeof this.view.bindHandlers === 'function') {
      this.view.bindHandlers({
        onNavigate: (route) => this.navigate(route),
        onAddTransaction: (transactionData) => this.handleAddTransaction(transactionData),
      });
    }

    console.log('FinSiteController initialized with model and view');
  }

  /**
     * Initialize the controller
     * Sets up event listeners and initial data
     */
  async init() {
    console.log('Controller initialization started');

    try {
      // 1) Load from storage via the model (async)
      const initialData = await this.model.init();

      // 2) Make sure we have a starting route in the model
      if (!initialData.currentView) {
        this.model.updateData({ currentView: 'dashboard' });
      }

      // 3) Get a fresh snapshot of state
      const data = this.model.getData();

      // 4) Tell the view to render based on model state
      this.view.update(data);

      // 5) Refresh dashboard charts with aggregated data
      this._refreshDashboardCharts();

      console.log('Controller initialization complete');
    } catch (error) {
      console.error('Error during controller initialization:', error);
    }
  }

  /**
     * Handle user interactions
     * @param {string} action - Action type
     * @param {Object} payload - Action data
     */
  handleAction(action, payload) {
    switch (action) {
      case 'navigate':
        this.navigate(payload.route);
        break;
      default:
        console.log('Unknown action:', action);
    }
  }

  /**
     * Navigate to different views
     * @param {string} route - Route to navigate to
     */
  navigate(route) {
    console.log(`🧭 Navigating to: ${route}`);
    this.model.updateData({ currentView: route });
    const data = this.model.getData();
    this.view.update(data);

    // Refresh dashboard charts when navigating to dashboard
    if (route === 'dashboard') {
      this._refreshDashboardCharts();
    }
  }

  /**
     * Refresh dashboard with aggregated data from model
     * Called after initialization, navigation to dashboard, and data changes
     * @param {boolean} isHeavyUpdate - True for bulk updates (CSV import)
     */
  _refreshDashboard(isHeavyUpdate = false) {
    // Get pre-aggregated chart data from model
    const chartData = this.model.getDashboardSummary();

    // Get panel summary (stats, recent activity) from model
    const panelSummary = this.model.getDashboardPanelSummary();

    // Pass chart data to view for chart component
    if (typeof this.view.updateDashboardCharts === 'function') {
      this.view.updateDashboardCharts(chartData, isHeavyUpdate);
    }

    // Pass panel summary to view for dashboard stat cards and recent activity
    if (typeof this.view.updateDashboardPanel === 'function') {
      this.view.updateDashboardPanel(panelSummary);
    }

    console.log('📊 Dashboard refreshed with chart data:', chartData);
    console.log('📋 Dashboard panel updated with summary:', panelSummary);
  }

  /**
     * Legacy method name - calls _refreshDashboard
     * @deprecated Use _refreshDashboard instead
     */
  _refreshDashboardCharts(isHeavyUpdate = false) {
    this._refreshDashboard(isHeavyUpdate);
  }

  /**
     * Handle adding a new transaction from the manual entry form
     * @param {Object} transactionData - Transaction data from the form
     */
  async handleAddTransaction(transactionData) {
    console.log('💰 Handling add transaction:', transactionData);

    try {
      // Use the model to persist the transaction to IndexedDB
      const savedTransaction = await this.model.addTransaction(transactionData);

      console.log('✅ Transaction saved successfully:', savedTransaction);

      // Get the transactions component and notify it of success
      const transactionsPage = document.querySelector('finsite-transactions');
      if (transactionsPage && typeof transactionsPage.onTransactionAdded === 'function') {
        transactionsPage.onTransactionAdded(savedTransaction);
      }

      // Update the view with the new data
      const data = this.model.getData();
      this.view.update(data);

      // Refresh dashboard charts (single transaction = light update with animation)
      this._refreshDashboardCharts(false);
    } catch (error) {
      console.error('❌ Error adding transaction:', error);

      // Notify the transactions component of the error
      const transactionsPage = document.querySelector('finsite-transactions');
      if (transactionsPage && typeof transactionsPage.onTransactionError === 'function') {
        transactionsPage.onTransactionError('Failed to save transaction. Please try again.');
      }
    }
  }

  /**
     * Handle bulk transaction import (CSV)
     * OPTIMIZATION A: Uses model.addTransactionsBulk for single-pass aggregate rebuild
     * @param {Array} transactions - Array of transaction objects
     */
  async handleBulkImport(transactions) {
    console.log('📦 Handling bulk import:', transactions.length, 'transactions');

    try {
      // Use bulk import method (single aggregate rebuild at the end)
      await this.model.addTransactionsBulk(transactions);

      // Update the view
      const data = this.model.getData();
      this.view.update(data);

      // Refresh dashboard charts (bulk = heavy update, no animation)
      this._refreshDashboardCharts(true);

      console.log('✅ Bulk import complete');
    } catch (error) {
      console.error('❌ Error during bulk import:', error);
    }
  }

  /**
     * Handle deleting transactions
     * @param {Array} ids - Array of transaction IDs to delete
     */
  async handleDeleteTransactions(ids) {
    console.log('🗑️ Handling delete transactions:', ids);

    try {
      await this.model.deleteTransactions(ids);

      // Update the view
      const data = this.model.getData();
      this.view.update(data);

      // Refresh dashboard charts
      this._refreshDashboardCharts(ids.length > 5);

      console.log('✅ Transactions deleted');
    } catch (error) {
      console.error('❌ Error deleting transactions:', error);
    }
  }
}
