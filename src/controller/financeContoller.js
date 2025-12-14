import { createPrefixedLogger } from '../utils/debugService.js';

/**
 * @fileoverview Controller layer for FinSite application.
 * Coordinates between Model and View following MVC pattern.
 * @module financeController
 */

/**
 * FinSite Controller - Coordinates between Model and View.
 *
 * Responsibilities:
 * - Handles user interactions and application events
 * - Orchestrates data flow between Model and View
 * - Manages navigation and routing
 * - Coordinates dashboard updates with aggregated data
 *
 * @class
 */

// Prefixed logger for controller layer
const log = createPrefixedLogger('[Controller]');

/**
 * FinSiteController - Coordinates between Model and View
 * Handles user interactions and application logic
 *
 * Follows MVC pattern where:
 * - Controller never queries DOM directly (uses view interface)
 * - All user feedback goes through view methods
 * - Debug logging is centrally toggleable
 */
export class FinSiteController {
    constructor(model, view) {
        this.model = model;
        this.view = view;

        if (typeof this.view.bindHandlers === 'function') {
            this.view.bindHandlers({
                onNavigate: (route) => this.navigate(route),
                onAddTransaction: (transactionData) => this.handleAddTransaction(transactionData),
                onUpdateTransaction: (transactionData) => this.handleUpdateTransaction(transactionData),
                onDeleteTransaction: (transactionId) => this.handleDeleteTransaction(transactionId),
                onDeleteGroup: (groupId, groupName) => this.handleDeleteGroup(groupId, groupName),
            });
        }

        log('FinSiteController initialized with model and view');
    }

    /**
     * Log errors (always output, not toggleable) and optionally notify view
     * @param {string} context - Where the error occurred
     * @param {Error} error - The error object
     * @param {string} [userMessage] - Optional message to show user via view
     * @private
     */
    _handleError(context, error, userMessage = null) {
        console.error(`${context}:`, error);

        if (userMessage && typeof this.view.showError === 'function') {
            this.view.showError(userMessage);
        }
    }

    // ============================================================
    // STATE SYNCHRONIZATION (DRY helper)
    // ============================================================

    /**
     * Synchronize model state to view - single source of truth for refresh flow.
     * Extracts the common "get data → update view → refresh dashboard" pattern
     * used across init, navigate, and all data-changing operations.
     *
     * @param {Object} [options={}] - Refresh options
     * @param {boolean} [options.isHeavyUpdate=false] - True for bulk operations (disables chart animations)
     * @param {boolean} [options.refreshDashboard=true] - Whether to refresh dashboard charts
     * @private
     */
    _syncModelToView({ isHeavyUpdate = false, refreshDashboard = true } = {}) {
        const data = this.model.getData();
        this.view.update(data);

        if (refreshDashboard) {
            this._refreshDashboard(isHeavyUpdate);
        }
    }

    /**
     * Initialize the controller
     * Sets up event listeners and initial data
     */
    async init() {
        log('Controller initialization started');

        try {
            // 1) Load from storage via the model (async)
            const initialData = await this.model.init();

            // 2) Make sure we have a starting route in the model
            if (!initialData.currentView) {
                this.model.updateData({ currentView: 'dashboard' });
            }

            // 3) Sync model state to view (includes dashboard refresh)
            this._syncModelToView();

            log('Controller initialization complete');
        } catch (error) {
            this._handleError(
                'Error during controller initialization',
                error,
                'Failed to load application data. Please refresh the page.',
            );
        }
    }

    /**
     * Handle generic user interactions.
     *
     * Routes actions to appropriate handler methods.
     *
     * @param {string} action - Action type (e.g., 'navigate')
     * @param {Object} payload - Action data
     */
    handleAction(action, payload) {
        switch (action) {
            case 'navigate':
                this.navigate(payload.route);
                break;
            default:
                log('Unknown action:', action);
        }
    }

    /**
     * Navigate to different views.
     *
     * Updates model state, refreshes view, and triggers dashboard
     * data refresh when navigating to dashboard.
     *
     * @param {string} route - Route to navigate to (e.g., 'dashboard', 'transactions')
     */
    navigate(route) {
        log(`🧭 Navigating to: ${route}`);
        this.model.updateData({ currentView: route });

        // Navigate through view interface
        this.view.navigateToPage(route);

        // Sync model data to the newly rendered page
        // This ensures transactions page gets data when navigated to
        this._syncModelToView({ refreshDashboard: route === 'dashboard' });
    }

    /**
     * Refresh dashboard with aggregated data from model
     * Called after initialization, navigation to dashboard, and data changes
     * @param {boolean} isHeavyUpdate - True for bulk updates (CSV import)
     * @private
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

        log('📊 Dashboard refreshed with chart data:', chartData);
        log('📋 Dashboard panel updated with summary:', panelSummary);
    }

    /**
     * Legacy method name - calls _refreshDashboard
     * @deprecated Use _refreshDashboard instead
     */
    _refreshDashboardCharts(isHeavyUpdate = false) {
        this._refreshDashboard(isHeavyUpdate);
    }

    /**
     * Handle adding a new transaction from the manual entry form.
     *
     * Persists transaction via model, notifies transactions component,
     * updates view, and refreshes dashboard with animation.
     *
     * @async
     * @param {Object} transactionData - Transaction data from the form
     * @param {string} transactionData.group - Group ID
     * @param {string} transactionData.category - Category ID
     * @param {number} transactionData.amount - Transaction amount
     * @param {string} transactionData.date - ISO date string (YYYY-MM-DD)
     * @param {string} [transactionData.merchant] - Merchant name
     * @param {string} [transactionData.notes] - Additional notes
     * @returns {Promise<void>}
     */
    async handleAddTransaction(transactionData) {
        log('💰 Handling add transaction:', transactionData);

        try {
            // Use the model to persist the transaction to IndexedDB
            const savedTransaction = await this.model.addTransaction(transactionData);

            log('✅ Transaction saved successfully:', savedTransaction);

            // Notify view of success (view routes to appropriate component)
            if (typeof this.view.onTransactionAdded === 'function') {
                this.view.onTransactionAdded(savedTransaction);
            }

            // Sync model state to view (single transaction = light update with animation)
            this._syncModelToView({ isHeavyUpdate: false });
        } catch (error) {
            this._handleError('Error adding transaction', error);

            // Notify view of error (view routes to appropriate component)
            if (typeof this.view.onTransactionError === 'function') {
                this.view.onTransactionError('Failed to save transaction. Please try again.');
            }
        }
    }

    /**
     * Handle transaction update
     * @param {Object} transactionData - Transaction data with id
     * @returns {Promise<void>}
     */
    async handleUpdateTransaction(transactionData) {
        log('✏️ Handling update transaction:', transactionData);

        try {
            // Use the model to update the transaction in IndexedDB
            const updatedTransaction = await this.model.updateTransaction(transactionData);

            log('✅ Transaction updated successfully:', updatedTransaction);

            // Notify view of success
            if (typeof this.view.onTransactionUpdated === 'function') {
                this.view.onTransactionUpdated(updatedTransaction);
            }

            // Sync model state to view
            this._syncModelToView({ isHeavyUpdate: false });
        } catch (error) {
            this._handleError('Error updating transaction', error);

            // Notify view of error
            if (typeof this.view.onTransactionError === 'function') {
                this.view.onTransactionError('Failed to update transaction. Please try again.');
            }
        }
    }

    /**
     * Handle transaction deletion
     * @param {number} transactionId - ID of transaction to delete
     * @returns {Promise<void>}
     */
    async handleDeleteTransaction(transactionId) {
        log('🗑️ Handling delete transaction:', transactionId);

        try {
            // Use the model to delete the transaction from IndexedDB
            await this.model.deleteTransaction(transactionId);

            log('✅ Transaction deleted successfully:', transactionId);

            // Notify view of success
            if (typeof this.view.onTransactionDeleted === 'function') {
                this.view.onTransactionDeleted(transactionId);
            }

            // Sync model state to view
            this._syncModelToView({ isHeavyUpdate: false });
        } catch (error) {
            this._handleError('Error deleting transaction', error);

            // Notify view of error
            if (typeof this.view.onTransactionError === 'function') {
                this.view.onTransactionError('Failed to delete transaction. Please try again.');
            }
        }
    }

    /**
     * Handle bulk transaction import (CSV)
     * OPTIMIZATION A: Uses model.addTransactionsBulk for single-pass aggregate rebuild
     * @param {Array} transactions - Array of transaction objects
     * @returns {Promise<{saved: number, skipped: number}>} Import result summary
     */
    async handleBulkImport(transactions) {
        log('📦 Handling bulk import:', transactions.length, 'transactions');

        try {
            // Use bulk import method (single aggregate rebuild at the end)
            const { saved, skipped } = await this.model.addTransactionsBulk(transactions);

            // Sync model state to view (bulk = heavy update, no animation)
            this._syncModelToView({ isHeavyUpdate: true });

            log(`✅ Bulk import complete: ${saved.length} saved, ${skipped.length} skipped`);

            // Notify view of completion with summary
            if (typeof this.view.onBulkImportComplete === 'function') {
                this.view.onBulkImportComplete({
                    savedCount: saved.length,
                    skippedCount: skipped.length,
                    skippedDetails: skipped,
                });
            }

            return { saved: saved.length, skipped: skipped.length };
        } catch (error) {
            this._handleError(
                'Error during bulk import',
                error,
                'Failed to import transactions. Please check your file format.',
            );
            return { saved: 0, skipped: transactions.length };
        }
    }

    /**
     * Handle deleting one or more transactions.
     *
     * Deletes via model, updates view, and refreshes dashboard.
     * Disables animations if deleting more than 5 transactions.
     *
     * @async
     * @param {Array<number|string>} ids - Array of transaction IDs to delete
     * @returns {Promise<void>}
     */
    async handleDeleteTransactions(ids) {
        log('🗑️ Handling delete transactions:', ids);

        try {
            await this.model.deleteTransactions(ids);

            // Sync model state to view (many deletions = heavy update)
            this._syncModelToView({ isHeavyUpdate: ids.length > 5 });

            log('✅ Transactions deleted');

            // Notify view of success
            if (typeof this.view.onTransactionsDeleted === 'function') {
                this.view.onTransactionsDeleted(ids);
            }
        } catch (error) {
            this._handleError(
                'Error deleting transactions',
                error,
                'Failed to delete transactions. Please try again.',
            );
        }
    }

    /**
     * Handle deleting a custom group
     * Called when user confirms deletion from the categories page
     * @param {string} groupId - ID of the group to delete
     * @param {string} groupName - Name of the group (for logging)
     */
    async handleDeleteGroup(groupId, groupName) {
        log(`🗑️ Handling delete group: ${groupName} (${groupId})`);

        if (!groupId) {
            log('⚠️ No group ID provided for deletion');
            return;
        }

        try {
            // Delete the group via model (reassigns categories to 'uncategorized')
            await this.model.deleteGroup(groupId);

            log(`✅ Group deleted successfully: ${groupName}`);

            // Notify view to update categories component
            if (typeof this.view.onGroupDeleted === 'function') {
                this.view.onGroupDeleted(groupId);
            }

            // Sync model state to view (group deletion affects categories and totals)
            this._syncModelToView({ isHeavyUpdate: false });
        } catch (error) {
            this._handleError(
                `Error deleting group '${groupName}'`,
                error,
                'Failed to delete group. Please try again.',
            );
        }
    }
}
